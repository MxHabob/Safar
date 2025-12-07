import Graphic from "@/components/shared/graphic";
import { ArrowRight } from "lucide-react";

interface DestinationLabelProps {
  title: string;
}

/**
 * Destination label component - Animated label overlay for travel guide cards
 * Shows destination name with hover animation
 */
const DestinationLabel = ({ title }: DestinationLabelProps) => {
  return (
    <div className="relative bg-background rounded-br-[18px]">
      <div className="pt-2 px-4 pb-3 overflow-hidden">
        <div className="text-sm font-light flex items-center">
          <p>{title}</p>
          <div className="w-0 group-hover:w-[24px] transition-[width] duration-300 ease-out overflow-hidden">
            <ArrowRight size={14} className="ml-2 shrink-0" />
          </div>
        </div>
      </div>

      <div className="absolute size-[18px]">
        <Graphic />
      </div>

      <div className="absolute size-[18px] top-0 -right-[18px]">
        <Graphic />
      </div>
    </div>
  );
};

export default DestinationLabel;

