const { spawn } = require('child_process');
const Execution = require('../../models/Execution');
const File = require('../../models/File');
const env = require('../../config/env');
const { EXECUTION_STATUS, SUPPORTED_LANGUAGES, ERROR_CODES } = require('../../../../shared/contracts/constants');
const { SOCKET_EVENTS, ROOMS } = require('../../../../shared/contracts/socketEvents');
const { AppError } = require('../../middleware/errorHandler');

class ExecutionsService {
  constructor() {
    this.activeProcesses = new Map(); // executionId -> ChildProcess
  }

  async submitExecution(workspaceId, { fileId, language, stdin = '' }, io = null) {
    if (!fileId || !language) {
      throw new AppError('fileId and language are required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const normalizedLang = language.toLowerCase().trim();
    if (!['javascript', 'python'].includes(normalizedLang)) {
      throw new AppError(`Unsupported language: "${language}". Allowed languages: javascript, python.`, 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const file = await File.findOne({ _id: fileId, workspaceId });
    if (!file) {
      throw new AppError('File not found in this workspace.', 404, ERROR_CODES.NOT_FOUND);
    }

    const execution = await Execution.create({
      workspaceId,
      fileId,
      language: normalizedLang,
      stdin: stdin || '',
      status: EXECUTION_STATUS.QUEUED,
      stdout: '',
      stderr: ''
    });

    // Run execution asynchronously outside main event loop
    setImmediate(() => {
      this.executeJob(execution.id, workspaceId, file.content || '', normalizedLang, stdin, io);
    });

    return {
      id: execution.id,
      status: execution.status,
      language: execution.language,
      createdAt: execution.createdAt
    };
  }

  async executeJob(executionId, workspaceId, code, language, stdin, io) {
    const startTime = Date.now();
    const room = ROOMS.workspace(workspaceId);

    try {
      const execution = await Execution.findById(executionId);
      if (!execution || execution.status === EXECUTION_STATUS.CANCELLED) return;

      execution.status = EXECUTION_STATUS.RUNNING;
      await execution.save();

      if (io) {
        io.to(room).emit(SOCKET_EVENTS.EXECUTION_STATUS, {
          executionId,
          status: EXECUTION_STATUS.RUNNING
        });
      }

      // Check if external execution provider is configured
      if (env.EXECUTION_SERVICE_URL) {
        await this.runExternalExecution(execution, code, language, stdin, io, room);
        return;
      }

      // Isolated subprocess execution with strict limits
      await this.runSandboxedSubprocess(execution, code, language, stdin, io, room, startTime);
    } catch (err) {
      console.error(`[Execution] Job ${executionId} failed:`, err);
      await Execution.updateOne(
        { _id: executionId },
        {
          status: EXECUTION_STATUS.FAILED,
          stderr: err.message,
          duration: Date.now() - startTime
        }
      );
      if (io) {
        io.to(room).emit(SOCKET_EVENTS.EXECUTION_STATUS, {
          executionId,
          status: EXECUTION_STATUS.FAILED,
          error: err.message
        });
      }
    }
  }

  runSandboxedSubprocess(execution, code, language, stdin, io, room, startTime) {
    return new Promise((resolve) => {
      const executionId = execution.id;
      let cmd, args;

      if (language === 'javascript') {
        cmd = 'node';
        args = ['--max-old-space-size=64', '-e', code];
      } else if (language === 'python') {
        cmd = 'python';
        args = ['-c', code];
      }

      let stdoutAccumulator = '';
      let stderrAccumulator = '';
      let isTimedOut = false;

      const proc = spawn(cmd, args, {
        timeout: 5000,
        env: { PATH: process.env.PATH },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.activeProcesses.set(executionId, proc);

      // Handle stdin if provided
      if (stdin && proc.stdin) {
        proc.stdin.write(stdin);
        proc.stdin.end();
      }

      // Stream stdout chunks
      proc.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        stdoutAccumulator += text;
        if (io) {
          io.to(room).emit(SOCKET_EVENTS.EXECUTION_OUTPUT, {
            executionId,
            stream: 'stdout',
            chunk: text
          });
        }
      });

      // Stream stderr chunks
      proc.stderr?.on('data', (chunk) => {
        const text = chunk.toString();
        stderrAccumulator += text;
        if (io) {
          io.to(room).emit(SOCKET_EVENTS.EXECUTION_OUTPUT, {
            executionId,
            stream: 'stderr',
            chunk: text
          });
        }
      });

      // Timeout watchdog (5000ms limit)
      const timer = setTimeout(() => {
        isTimedOut = true;
        proc.kill('SIGKILL');
      }, 5000);

      proc.on('close', async (exitCode) => {
        clearTimeout(timer);
        this.activeProcesses.delete(executionId);
        const duration = Date.now() - startTime;

        let finalStatus = EXECUTION_STATUS.COMPLETED;
        if (isTimedOut) {
          finalStatus = EXECUTION_STATUS.TIMED_OUT;
          stderrAccumulator += '\n[Execution timed out after 5000ms limit]';
        } else if (exitCode !== 0) {
          finalStatus = EXECUTION_STATUS.FAILED;
        }

        await Execution.updateOne(
          { _id: executionId },
          {
            status: finalStatus,
            stdout: stdoutAccumulator,
            stderr: stderrAccumulator,
            exitCode: exitCode ?? -1,
            duration
          }
        );

        if (io) {
          io.to(room).emit(SOCKET_EVENTS.EXECUTION_STATUS, {
            executionId,
            status: finalStatus,
            exitCode,
            duration
          });
        }

        resolve();
      });

      proc.on('error', async (err) => {
        clearTimeout(timer);
        this.activeProcesses.delete(executionId);
        const duration = Date.now() - startTime;

        await Execution.updateOne(
          { _id: executionId },
          {
            status: EXECUTION_STATUS.FAILED,
            stderr: err.message,
            duration
          }
        );

        if (io) {
          io.to(room).emit(SOCKET_EVENTS.EXECUTION_STATUS, {
            executionId,
            status: EXECUTION_STATUS.FAILED,
            error: err.message
          });
        }

        resolve();
      });
    });
  }

  async getExecution(workspaceId, executionId) {
    const execution = await Execution.findOne({ _id: executionId, workspaceId });
    if (!execution) {
      throw new AppError('Execution record not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    return {
      id: execution.id,
      workspaceId: execution.workspaceId.toString(),
      fileId: execution.fileId.toString(),
      language: execution.language,
      status: execution.status,
      stdout: execution.stdout || '',
      stderr: execution.stderr || '',
      exitCode: execution.exitCode,
      duration: execution.duration,
      createdAt: execution.createdAt
    };
  }

  async cancelExecution(workspaceId, executionId, io = null) {
    const execution = await Execution.findOne({ _id: executionId, workspaceId });
    if (!execution) {
      throw new AppError('Execution record not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (this.activeProcesses.has(executionId)) {
      const proc = this.activeProcesses.get(executionId);
      proc.kill('SIGKILL');
      this.activeProcesses.delete(executionId);
    }

    execution.status = EXECUTION_STATUS.CANCELLED;
    await execution.save();

    if (io) {
      io.to(ROOMS.workspace(workspaceId)).emit(SOCKET_EVENTS.EXECUTION_STATUS, {
        executionId,
        status: EXECUTION_STATUS.CANCELLED
      });
    }

    return {
      id: execution.id,
      status: execution.status,
      language: execution.language
    };
  }
}

module.exports = new ExecutionsService();
