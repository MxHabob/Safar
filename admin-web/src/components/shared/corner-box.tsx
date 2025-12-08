import Graphic from "./graphic";

interface CornerBoxProps {
    children: React.ReactNode;
    className?: string;
    position: "top-left" | "top-right";
    onClick?: () => void;
  }
  
  const CornerBox = ({ children, className = "", position, onClick }: CornerBoxProps) => {
    const isTopLeft = position === "top-left";
    const isTopRight = position === "top-right";
  
    return (
      <div
        className={`
          fixed z-40 bg-background cursor-pointer select-none
          ${isTopLeft ? "top-3 left-3 rounded-br-[18px]" : ""}
          ${isTopRight ? "top-3 right-3 rounded-bl-[18px]" : ""}
          ${className}
        `}
        onClick={onClick}
      >
        <div className="relative px-4 pb-3">
          {children}
  
          {/* Quarter circles */}
          {isTopLeft && (
            <>
              <Graphic className="absolute left-0 -bottom-[18px]" />
              <Graphic className="absolute -right-[18px] top-0" />
            </>
          )}
          {isTopRight && (
            <>
              <Graphic className="absolute -bottom-4 right-0 rotate-90" />
              <Graphic className="absolute -left-4 top-0 rotate-90" />
            </>
          )}
        </div>
      </div>
    );
  };
  
  export default CornerBox;