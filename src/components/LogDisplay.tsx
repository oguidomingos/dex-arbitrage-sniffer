import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

interface Log {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'error' | 'success';
}

export const LogDisplay = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      setLogs(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        type: 'info'
      }].slice(-50)); // Mantém apenas os últimos 50 logs
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      setLogs(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        type: 'error'
      }].slice(-50));
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-muted-foreground">Logs do Sistema</h3>
      <ScrollArea className="h-[200px] rounded-md border border-polygon-purple/20 p-4 bg-black/20">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhum log registrado
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className={`text-sm font-mono p-2 rounded-lg ${
                  log.type === 'error' 
                    ? 'bg-red-950/50 text-red-200' 
                    : log.type === 'success'
                    ? 'bg-green-950/50 text-green-200'
                    : 'bg-black/30 text-gray-200'
                }`}
              >
                <div className="text-xs text-muted-foreground">
                  {log.timestamp.toLocaleTimeString()}
                </div>
                <pre className="whitespace-pre-wrap break-words">
                  {log.message}
                </pre>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};