import { ExternalLink } from "lucide-react";

const KabejjaAdCard = () => {
  return (
    <a
      href="https://www.kabejjasystems.store"
      target="_blank"
      rel="noopener noreferrer"
      className="block mx-4 my-4 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-lg">K</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Kabejja Systems
            </p>
            <p className="text-xs text-muted-foreground">
              Custom software, web apps & IT solutions
            </p>
          </div>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </a>
  );
};

export default KabejjaAdCard;
