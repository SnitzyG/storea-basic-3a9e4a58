// Build version for debugging deployment issues
export const BUILD_VERSION = '1.0.0';
export const BUILD_TIMESTAMP = new Date().toISOString();

interface AppVersionProps {
  showInProduction?: boolean;
}

export const AppVersion = ({ showInProduction = false }: AppVersionProps) => {
  const isDev = import.meta.env.DEV;
  const showVersion = new URLSearchParams(window.location.search).has('debug');
  
  if (!isDev && !showInProduction && !showVersion) {
    return null;
  }

  return (
    <span className="text-[10px] text-muted-foreground/50 font-mono">
      v{BUILD_VERSION}
    </span>
  );
};
