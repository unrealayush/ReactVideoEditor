import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  HISTORY_UNDO,
  HISTORY_REDO,
  dispatch,
  DESIGN_RESIZE,
} from "@designcombo/events";
import logoDark from "@/assets/logo-dark.png";
import { Icons } from "@/components/shared/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { download } from "@/utils/download";
// import useAuthStore from "@/store/use-auth-store";
// import { useNavigate } from "react-router-dom";

// import {
//   Cloud,
//   CreditCard,
//   Github,
//   Keyboard,
//   LifeBuoy,
//   LogOut,
//   Mail,
//   MessageSquare,
//   Plus,
//   PlusCircle,
//   Settings,
//   User,
//   UserPlus,
//   Users,
// } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuPortal,
//   DropdownMenuSeparator,
//   DropdownMenuShortcut,
//   DropdownMenuSub,
//   DropdownMenuSubContent,
//   DropdownMenuSubTrigger,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useStore from "@/pages/editor/store/use-store";
import { IDesign } from "@designcombo/types";
import { generateId } from "@designcombo/timeline";
const size = {
  width: 1080,
  height: 1920,
};
//  https://renderer.designcombo.dev/status/{id}
export default function Navbar() {
  const handleUndo = () => {
    dispatch(HISTORY_UNDO);
  };

  const handleRedo = () => {
    dispatch(HISTORY_REDO);
  };

  // const openLink = (url: string) => {
  //   window.open(url, "_blank"); // '_blank' will open the link in a new tab
  // };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr 320px",
      }}
      className="pointer-events-none absolute left-0 right-0 top-0 z-[205] flex h-[72px] items-center px-2"
    >
      <div className="pointer-events-auto flex h-14 items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-background">
          <img src={logoDark} alt="logo" className="h-5 w-5" />
        </div>
        <div className="flex h-12 items-center bg-background px-1.5">
          <Button
            onClick={handleUndo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <Icons.undo width={20} />
          </Button>
          <Button
            onClick={handleRedo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <Icons.redo width={20} />
          </Button>
        </div>
      </div>

      <div className="pointer-events-auto flex h-14 items-center justify-center gap-2">
        <div className="flex h-12 items-center gap-4 rounded-md bg-background px-2.5">
          <div className="px-1 text-sm font-medium">Untitled video</div>
          <ResizeVideo />
        </div>
      </div>

      <div className="pointer-events-auto flex h-14 items-center justify-end gap-2">
        <div className="flex h-12 items-center gap-2 rounded-md bg-background px-2.5">
          <DownloadPopover />
        </div>
      </div>
    </div>
  );
}

// const UserMenu = () => {
//   const { user, signOut } = useAuthStore();
//   const navigate = useNavigate();
//   if (!user) {
//     return (
//       <Button
//         onClick={() => navigate("/auth")}
//         className="flex h-8 gap-1"
//         variant="default"
//       >
//         Sign in
//       </Button>
//     );
//   }

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Avatar className="h-8 w-8 cursor-pointer">
//           <AvatarImage src={user.avatar} alt="@user" />
//           <AvatarFallback>{user.email.slice(0, 2)}</AvatarFallback>
//         </Avatar>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent className="mr-2 mt-2 w-56">
//         <DropdownMenuLabel>My Account</DropdownMenuLabel>
//         <DropdownMenuSeparator />
//         <DropdownMenuGroup>
//           <DropdownMenuItem>
//             <User className="mr-2 h-4 w-4" />
//             <span>Profile</span>
//             <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
//           </DropdownMenuItem>
//           <DropdownMenuItem>
//             <CreditCard className="mr-2 h-4 w-4" />
//             <span>Billing</span>
//             <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
//           </DropdownMenuItem>
//           <DropdownMenuItem>
//             <Settings className="mr-2 h-4 w-4" />
//             <span>Settings</span>
//             <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
//           </DropdownMenuItem>
//           <DropdownMenuItem>
//             <Keyboard className="mr-2 h-4 w-4" />
//             <span>Keyboard shortcuts</span>
//             <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
//           </DropdownMenuItem>
//         </DropdownMenuGroup>
//         <DropdownMenuSeparator />
//         <DropdownMenuGroup>
//           <DropdownMenuItem>
//             <Users className="mr-2 h-4 w-4" />
//             <span>Team</span>
//           </DropdownMenuItem>
//           <DropdownMenuSub>
//             <DropdownMenuSubTrigger>
//               <UserPlus className="mr-2 h-4 w-4" />
//               <span>Invite users</span>
//             </DropdownMenuSubTrigger>
//             <DropdownMenuPortal>
//               <DropdownMenuSubContent>
//                 <DropdownMenuItem>
//                   <Mail className="mr-2 h-4 w-4" />
//                   <span>Email</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem>
//                   <MessageSquare className="mr-2 h-4 w-4" />
//                   <span>Message</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem>
//                   <PlusCircle className="mr-2 h-4 w-4" />
//                   <span>More...</span>
//                 </DropdownMenuItem>
//               </DropdownMenuSubContent>
//             </DropdownMenuPortal>
//           </DropdownMenuSub>
//           <DropdownMenuItem>
//             <Plus className="mr-2 h-4 w-4" />
//             <span>New Team</span>
//             <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
//           </DropdownMenuItem>
//         </DropdownMenuGroup>
//         <DropdownMenuSeparator />
//         <DropdownMenuItem>
//           <Github className="mr-2 h-4 w-4" />
//           <span>GitHub</span>
//         </DropdownMenuItem>
//         <DropdownMenuItem>
//           <LifeBuoy className="mr-2 h-4 w-4" />
//           <span>Support</span>
//         </DropdownMenuItem>
//         <DropdownMenuItem disabled>
//           <Cloud className="mr-2 h-4 w-4" />
//           <span>API</span>
//         </DropdownMenuItem>
//         <DropdownMenuSeparator />
//         <DropdownMenuItem onClick={signOut}>
//           <LogOut className="mr-2 h-4 w-4" />
//           <span>Log out</span>
//           <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// };

interface IDownloadState {
  renderId: string;
  progress: number;
  isDownloading: boolean;
}
const DownloadPopover = () => {
  const [open, setOpen] = useState(false);
  const [downloadState, setDownloadState] = useState<IDownloadState>({
    progress: 0,
    isDownloading: false,
    renderId: "",
  });
  const {
    tracks,
    trackItemIds,
    trackItemsMap,
    trackItemDetailsMap,
    transitionsMap,
    fps,
  } = useStore();

  const handleExport = async () => {
    console.log("Export started"); // Debug point 1
    const data: IDesign = {
      id: generateId(),
      fps,
      tracks,
      size,
      trackItemDetailsMap,
      trackItemIds,
      transitionsMap,
      trackItemsMap,
      transitionIds: [],
    };
    setDownloadState(prevState => ({
      ...prevState,
      isDownloading: true,
      progress: 0,
    }));
  
    console.log("Data prepared:", data); // Debug point 2
  
    try {
      console.log("Making fetch request to server..."); // Debug point 3
      const response = await fetch(`http://localhost:3000/render`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      console.log("Server response received:", response); // Debug point 4
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("Parsed result:", result); // Debug point 5
  
      setDownloadState(prevState => ({
        ...prevState,
        renderId: result['renderId'],
      }));
      console.log("Download state updated"); // Debug point 6
  
    } catch (error) {
      console.error("Export failed:", error); // Debug point 7
      setDownloadState(prevState => ({
        ...prevState,
        isDownloading: false,
        progress: 0,
        renderId: "",
      }));
    }
  };
  

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (downloadState.renderId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:3000/status/${downloadState.renderId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Calculate progress based on frames rendered vs total frames
          const framesRendered = data.framesRendered;
          // const encodingProgress = data.encodingStatus?.framesEncoded || 0;
          const isDone = data.done;
          
          // Calculate total progress (consider both rendering and encoding)
          let progress = 0;
          if (isDone) {
            progress = 100;
          } else if (framesRendered > 0) {
            // Assuming encoding takes about 20% of the total process
            const renderingProgress = (framesRendered / (data.chunks * 30)) * 80; // 80% weight
            const encodingProgress = (data.encodingStatus?.framesEncoded || 0) / framesRendered * 20; // 20% weight
            progress = Math.min(Math.round(renderingProgress + encodingProgress), 99);
          }
          
          if (isDone) {
            clearInterval(interval);

            setDownloadState({
              renderId: "",
              progress: 0,
              isDownloading: false,
            });
            console.log(data)
          download(data.outputFile,"ouptut.mp4")

            // Handle the completed render - you'll need to implement the download logic
            // based on where your rendered video is stored
            setOpen(false);
          } else {
            setDownloadState({
              renderId: downloadState.renderId,
              progress,
              isDownloading: true,
            });
          }
        } catch (error) {
          console.error('Error fetching status:', error);
          setDownloadState({
            renderId: "",
            progress: 0,
            isDownloading: false,
          });
          clearInterval(interval);
        }
      }, 1000);
    }
  
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [downloadState.renderId]);
  

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="flex h-9 w-9 gap-1 border border-border"
          size="icon"
          variant="secondary"
        >
          <Download width={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[250] flex w-60 flex-col gap-4">
        {downloadState.isDownloading ? (
          <>
            <Label>Downloading</Label>
            <div className="flex items-center gap-2">
              <Progress
                className="h-2 rounded-sm"
                value={downloadState.progress}
              />
              <div className="rounded-sm border border-border p-1 text-sm text-zinc-400">
                {parseInt(downloadState.progress.toString())}%
              </div>
            </div>
            <div>
              <Button className="w-full">Copy link</Button>
            </div>
          </>
        ) : (
          <>
            <Label>Export settings</Label>
            <Button className="w-full justify-between" variant="outline">
              <div>MP4</div>
              <ChevronDown width={16} />
            </Button>
            <div>
              <Button onClick={handleExport} className="w-full">
                Export
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

interface ResizeOptionProps {
  label: string;
  icon: string;
  value: ResizeValue;
  description: string;
}

interface ResizeValue {
  width: number;
  height: number;
  name: string;
}

const RESIZE_OPTIONS: ResizeOptionProps[] = [
  {
    label: "16:9",
    icon: "landscape",
    description: "YouTube ads",
    value: {
      width: 1920,
      height: 1080,
      name: "16:9",
    },
  },
  {
    label: "9:16",
    icon: "portrait",
    description: "TikTok, YouTube Shorts",
    value: {
      width: 1080,
      height: 1920,
      name: "9:16",
    },
  },
  {
    label: "1:1",
    icon: "square",
    description: "Instagram, Facebook posts",
    value: {
      width: 1080,
      height: 1080,
      name: "1:1",
    },
  },
];

const ResizeVideo = () => {
  const handleResize = (options: ResizeValue) => {
    dispatch(DESIGN_RESIZE, {
      payload: {
        ...options,
      },
    });
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="border border-border" variant="secondary">
          Resize
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[250] w-60 px-2.5 py-3">
        <div className="text-sm">
          {RESIZE_OPTIONS.map((option, index) => (
            <ResizeOption
              key={index}
              label={option.label}
              icon={option.icon}
              value={option.value}
              handleResize={handleResize}
              description={option.description}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ResizeOption = ({
  label,
  icon,
  value,
  description,
  handleResize,
}: ResizeOptionProps & { handleResize: (payload: ResizeValue) => void }) => {
  const Icon = Icons[icon as "text"];
  return (
    <div
      onClick={() => handleResize(value)}
      className="flex cursor-pointer items-center rounded-md p-2 hover:bg-zinc-50/10"
    >
      <div className="w-8 text-muted-foreground">
        <Icon size={20} />
      </div>
      <div>
        <div>{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
};