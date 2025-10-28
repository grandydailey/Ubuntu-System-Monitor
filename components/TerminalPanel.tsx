import React, { useState, useEffect, useRef, useCallback } from 'react';
import Panel from './Panel';
import { SYSLOG_DATA, AUTH_LOG_SAMPLE, APACHE_LOG_SAMPLE } from '../data/mockLogs';

const fileSystemData = {
    'home': {
        type: 'dir',
        content: {
            'namour': {
                type: 'dir',
                content: {
                    '.bash_history': { type: 'file', content: 'ls -a\ncd /var/log\nneofetch\nclear' },
                    'notes.txt': { type: 'file', content: 'System monitoring dashboard is looking great.' },
                    'projects': {
                        type: 'dir',
                        content: { 'README.md': { type: 'file', content: '# My Projects' } }
                    },
                }
            }
        }
    },
    'var': {
        type: 'dir',
        content: {
            'log': {
                type: 'dir',
                content: {
                    'syslog': { type: 'file', content: SYSLOG_DATA.join('\n') },
                    'auth.log': { type: 'file', content: AUTH_LOG_SAMPLE.join('\n') },
                    'apache2': {
                        type: 'dir',
                        content: { 'access.log': { type: 'file', content: APACHE_LOG_SAMPLE.join('\n') } }
                    }
                }
            }
        }
    }
};

type File = { type: 'file'; content: string };
type Directory = { type: 'dir'; content: { [key: string]: File | Directory } };
type FSNode = File | Directory;

// Icon SVGs as strings for direct injection into HTML. Using hardcoded colors from the theme.
const FolderIconSVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: -2px; margin-right: 4px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
const FileIconSVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: -2px; margin-right: 4px;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;


const TerminalPanel: React.FC = () => {
    const [history, setHistory] = useState<string[]>(['Welcome to Namour System Monitor! Type `help` to see available commands.']);
    const [input, setInput] = useState('');
    const [cwd, setCwd] = useState('/home/namour');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const historyIndexRef = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);
    
    const resolvePath = useCallback((path: string): string => {
        if (path.startsWith('/')) return path;
        const newPath = path === '~' ? '/home/namour' : `${cwd}/${path}`;
        const parts = newPath.split('/').filter(p => p);
        const stack: string[] = [];
        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') {
                stack.pop();
            } else {
                stack.push(part);
            }
        }
        return '/' + stack.join('/');
    }, [cwd]);
    
    const getNode = useCallback((path: string): FSNode | null => {
        const resolved = resolvePath(path);
        const parts = resolved.split('/').filter(p => p);
        let current: any = fileSystemData;
        for (const part of parts) {
            if (current.type === 'dir' && current.content[part]) {
                current = current.content[part];
            } else {
                return null;
            }
        }
        return current;
    }, [resolvePath]);

    const processCommand = useCallback((command: string) => {
        const [cmd, ...args] = command.trim().split(' ');
        let output: string[] = [];

        switch (cmd) {
            case 'help':
                output = [
                    'Available commands:',
                    '  <span class="text-primary">help</span>         - Shows this help message.',
                    '  <span class="text-primary">ls [-a]</span>      - Lists files and directories.',
                    '  <span class="text-primary">cd [dir]</span>     - Changes directory.',
                    '  <span class="text-primary">cat [file]</span>   - Displays file content.',
                    '  <span class="text-primary">grep [pat] [f]</span> - Searches for a pattern in a file.',
                    '  <span class="text-primary">echo [text]</span>    - Prints text.',
                    '  <span class="text-primary">whoami</span>       - Shows the current user.',
                    '  <span class="text-primary">date</span>         - Shows the current date.',
                    '  <span class="text-primary">neofetch</span>     - Shows system info.',
                    '  <span class="text-primary">sudo</span>         - Execute a command as another user.',
                    '  <span class="text-primary">clear</span>        - Clears the terminal screen.',
                ];
                break;
            case 'ls':
                const node = getNode(args.find(a => !a.startsWith('-')) || '.');
                if (node && node.type === 'dir') {
                    const showAll = args.includes('-a');
                    const entries = Object.keys(node.content)
                        .filter(name => showAll || !name.startsWith('.'))
                        .map(name => {
                            if (node.content[name].type === 'dir') {
                                return `${FolderIconSVG}<span class="text-primary">${name}/</span>`;
                            }
                            return `${FileIconSVG}${name}`;
                        });
                    output = [entries.join('  ')];
                } else {
                    output = [`ls: cannot access '${args[0] || '.'}': No such file or directory`];
                }
                break;
            case 'cd':
                if (!args[0]) { setCwd('/home/namour'); break; }
                const newPath = resolvePath(args[0]);
                const dirNode = getNode(newPath);
                if (dirNode && dirNode.type === 'dir') {
                    setCwd(newPath === '/' ? '/' : newPath.replace(/\/$/, ''));
                } else {
                    output = [`cd: ${args[0]}: No such file or directory`];
                }
                break;
            case 'cat':
                const fileNode = getNode(args[0]);
                if (fileNode && fileNode.type === 'file') {
                    output = fileNode.content.split('\n');
                } else {
                    output = [`cat: ${args[0]}: No such file or directory`];
                }
                break;
            case 'grep':
                const [pattern, filename] = args;
                if (!pattern || !filename) {
                    output = ['usage: grep [pattern] [filename]'];
                    break;
                }
                const grepFile = getNode(filename);
                if (grepFile && grepFile.type === 'file') {
                    const regex = new RegExp(`(${pattern})`, 'gi');
                    output = grepFile.content.split('\n')
                        .filter(line => line.toLowerCase().includes(pattern.toLowerCase()))
                        .map(line => line.replace(regex, '<span class="text-green font-bold bg-green/20">$1</span>'));
                    if (output.length === 0) output = [''];
                } else {
                    output = [`grep: ${filename}: No such file or directory`];
                }
                break;
            case 'echo':
                output = [args.join(' ')];
                break;
            case 'whoami':
                output = ['namour'];
                break;
            case 'date':
                output = [new Date().toString()];
                break;
            case 'neofetch':
                output = [
                    '<div class="flex gap-4">',
                    '<div class="text-primary">',
                    ...[
'        .--.         ',
'       |o_o |        ',
'       |:_/ |        ',
'      //   \\ \\       ',
'     (|     | )      ',
'    /\'_   _/\`\\      ',
'    \\___)=(___/      '
                    ].map(l => `<span>${l.replace(/ /g, '&nbsp;')}</span>`),
                    '</div>',
                    '<div>',
                    '  <span class="text-primary font-bold">namour@ubuntu-prod-01</span>',
                    '  <span>-------------------</span>',
                    '  <span><span class="text-primary">OS</span>: Ubuntu 22.04.3 LTS</span>',
                    '  <span><span class="text-primary">Host</span>: VirtualBox 1.2</span>',
                    '  <span><span class="text-primary">Kernel</span>: 5.15.0-78-generic</span>',
                    '  <span><span class="text-primary">Uptime</span>: 3 days, 14 hours</span>',
                    '  <span><span class="text-primary">Shell</span>: bash 5.1.16</span>',
                    '  <span><span class="text-primary">CPU</span>: Intel Xeon E5-2673 v3</span>',
                    '  <span><span class="text-primary">Memory</span>: 4.2GiB / 16.0GiB</span>',
                    '</div>',
                    '</div>',
                ].map(l => l.replace(/ /g, '&nbsp;'));
                break;
            case 'sudo':
                output = ['[sudo] password for namour: Sorry, try again.'];
                break;
            case 'clear':
                setHistory([]);
                return;
            case '':
                break;
            default:
                output = [`${cmd}: command not found`];
        }

        setHistory(prev => [...prev, `<span class="text-primary-focus">namour@ubuntu-prod-01</span>:<span class="text-green">${cwd.replace('/home/namour', '~')}</span>$ ${command}`, ...output]);
    }, [cwd, resolvePath, getNode]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = input.trim();
            
            processCommand(input);

            if (command) {
                if (commandHistory[commandHistory.length - 1] !== command) {
                    const newCommandHistory = [...commandHistory, command];
                    setCommandHistory(newCommandHistory);
                    historyIndexRef.current = newCommandHistory.length;
                } else {
                     historyIndexRef.current = commandHistory.length;
                }
            }
            setInput('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;
            
            const newIndex = Math.max(0, historyIndexRef.current - 1);
            historyIndexRef.current = newIndex;
            setInput(commandHistory[newIndex] || '');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (commandHistory.length === 0) return;

            const newIndex = Math.min(commandHistory.length, historyIndexRef.current + 1);
            historyIndexRef.current = newIndex;
            setInput(commandHistory[newIndex] || '');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        // If user types, they are no longer navigating history.
        // Reset index to "end" so the next ArrowUp starts from the last command.
        historyIndexRef.current = commandHistory.length;
    };

    const prompt = `namour@ubuntu-prod-01:${cwd.replace('/home/namour', '~')}$`;

    return (
        <Panel title="./bash -i" className="flex flex-col">
            <div
                ref={scrollRef}
                className="p-2 flex-grow overflow-y-auto text-xs font-mono text-text-secondary"
                onClick={() => inputRef.current?.focus()}
            >
                {history.map((line, index) => (
                    <div key={index} dangerouslySetInnerHTML={{ __html: line }} className="whitespace-pre-wrap break-all" />
                ))}
                <div className="flex">
                    <span className="text-primary-focus">{prompt.split(':')[0]}</span>:
                    <span className="text-green">{prompt.split(':')[1]}</span>
                    <span>$&nbsp;</span>
                    <span className="flex-1">{input}</span>
                    <span className="cursor-blink"></span>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="absolute opacity-0 w-0 h-0"
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
            </div>
        </Panel>
    );
};

export default TerminalPanel;