"use client";

export default function SentryTestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Sentry Setup Verification</h1>
      <p className="text-muted-foreground">
        Click the button below to trigger a test error.
      </p>
      <button
        onClick={() => {
          throw new Error("Sentry Test Error: " + new Date().toISOString());
        }}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Trigger Client-side Error
      </button>

      <div className="mt-8 p-4 border rounded-lg bg-muted text-sm max-w-md">
        <strong>Nota:</strong> Como configuramos o Sentry para rodar apenas em
        <code className="mx-1 px-1 bg-background rounded">production</code>,
        este erro só será enviado se você estiver rodando o build de produção
        (<code>npm run build && npm run start</code>) ou se habilitar o modo de teste.
      </div>
    </div>
  );
}
