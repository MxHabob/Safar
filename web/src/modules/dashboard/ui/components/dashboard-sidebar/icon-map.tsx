import {
  LayoutDashboard,
  Image,
  User,
  Building,
  FileText,
} from "lucide-react";

interface IconMapProps {
  icon: string;
}

const IconMap = ({ icon }: IconMapProps) => {
  switch (icon) {
    case "dashboard":
      return <LayoutDashboard />;
    case "photo":
      return <Image />;
    case "user":
      return <User />;
    case "city":
      return <Building />;
    case "post":
      return <FileText />;
    default:
      return <LayoutDashboard />;
  }
};

export default IconMap;
