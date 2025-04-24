import { ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Link from "next/link";

const AIAssistant = () => {
    return ( 
     <div className="container mx-auto px-4 sm:px-6 lg:px-24" >
     <Link href={"/"}>
        <div className="bg-card rounded-full flex items-center justify-between p-3 pl-5">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium">Ask blue about your trip and he will create boxes just for you.</span>
            <Badge className="ml-2">BETA</Badge>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </Link>
      </div>
     );
}
 
export default AIAssistant;