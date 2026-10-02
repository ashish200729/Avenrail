/** Typed static imports allow production tree-shaking without untyped deep modules. */
import {
  HugeiconsIcon,
  type HugeiconsIconProps,
  type IconSvgElement,
} from "@hugeicons/react";
import {
  Add01Icon,
  AddSquareIcon,
  AlertCircleIcon,
  AppWindowIcon,
  Archive02Icon,
  ArrowDown01Icon,
  ArrowExpand01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowTurnForwardIcon,
  ArrowUp01Icon,
  BotIcon,
  AiIdeaIcon,
  Cancel01Icon,
  CaseSensitiveIcon,
  Chatting01Icon,
  CheckmarkCircle02Icon,
  CircleArrowDown01Icon,
  CancelCircleIcon,
  ChartBreakoutSquareIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CloudUploadIcon,
  Clock01Icon,
  ColorPickerIcon,
  Comment01Icon,
  CommentAdd01Icon,
  ComputerTerminal01Icon,
  Copy01Icon,
  CursorMagicSelection04Icon,
  DashboardSquare01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  File01Icon,
  Attachment01Icon,
  GitForkIcon,
  FileAddIcon,
  FileDiffIcon,
  FileScriptIcon,
  FilterIcon,
  FlashIcon,
  Folder01Icon,
  FolderAddIcon,
  FolderOpenIcon,
  FolderTreeIcon,
  GaugeIcon,
  GitBranchIcon,
  GitCompareIcon,
  GitMergeIcon,
  GitPullRequestClosedIcon,
  GitPullRequestDraftIcon,
  GitPullRequestIcon,
  GlobeIcon,
  InternetIcon,
  HelpCircleIcon,
  ImageAdd01Icon,
  InboxIcon,
  NotificationOff01Icon,
  KeyboardIcon,
  LayoutAlignRightIcon,
  LayoutBottomIcon,
  LayoutTopIcon,
  LeftToRightListBulletIcon,
  LinkSquare02Icon,
  Loading03Icon,
  MagicWand01Icon,
  MessageMultiple01Icon,
  MinusSignIcon,
  MoreHorizontalIcon,
  Note01Icon,
  PaintBoardIcon,
  PauseIcon,
  PencilEdit01Icon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  PreferenceHorizontalIcon,
  Refresh01Icon,
  RegexIcon,
  ReplaceIcon,
  Search01Icon,
  Settings01Icon,
  Share02Icon,
  SidebarRight01Icon,
  SparklesIcon,
  SquareIcon,
  SquareLock02Icon,
  StarIcon,
  Tick02Icon,
  TickDouble02Icon,
  UndoIcon,
  UngroupItemsIcon,
  ViewIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { forwardRef, type Ref } from "react";

/** Props shared by every chrome icon. `icon` is filled in by the named wrappers. */
export type IconProps = Omit<HugeiconsIconProps, "icon">;

export type IconComponent = ReturnType<typeof wrap>;

function wrap(icon: IconSvgElement, name: string) {
  const Component = forwardRef(function Icon(
    { strokeWidth = 1.75, ...props }: IconProps,
    ref: Ref<SVGSVGElement>,
  ) {
    return (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        strokeWidth={strokeWidth}
        {...props}
      />
    );
  });
  Component.displayName = name;
  return Component;
}

const stroke = {
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: "1.5",
} as const;

// These chrome glyphs are not exported by every supported Hugeicons pack.
// Keep their established actions visible using the same SVG stroke vocabulary.
const FilePlusCornerIcon: IconSvgElement = [
  [
    "path",
    {
      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7M14 2v6h6M14 2l6 6v5M19 16v6M16 19h6",
      ...stroke,
      key: "0",
    },
  ],
];
const ListEndIcon: IconSvgElement = [
  [
    "path",
    {
      d: "M4 5h16M4 9h16M4 13h6M4 17h6M13 13v4h7M17 14l3 3-3 3",
      ...stroke,
      key: "0",
    },
  ],
];
const RotateCcwIcon: IconSvgElement = [
  ["path", { d: "M3 11a9 9 0 1 1 2.6 6.4M3 4v7h7", ...stroke, key: "0" }],
];
const ShieldAlertIcon: IconSvgElement = [
  [
    "path",
    {
      d: "M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM12 8v5M12 16h.01",
      ...stroke,
      key: "0",
    },
  ],
];
const WholeWordIcon: IconSvgElement = [
  [
    "path",
    {
      d: "M3 7v10M21 7v10M7 11h4v6H7a2 2 0 0 1 0-4h4M15 7v10h2a3 3 0 0 0 0-6h-2",
      ...stroke,
      key: "0",
    },
  ],
];

/** Catalog FoldVertical/UnfoldVertical use filled chevrons; keep these stroke-only. */
const foldDashes: IconSvgElement = [
  ["path", { d: "M2 12H4", ...stroke, key: "0" }],
  ["path", { d: "M8 12H10", ...stroke, key: "1" }],
  ["path", { d: "M14 12H16", ...stroke, key: "2" }],
  ["path", { d: "M20 12H22", ...stroke, key: "3" }],
];

const FoldVerticalIcon: IconSvgElement = [
  ...foldDashes,
  ["path", { d: "M7 2L12 7L17 2", ...stroke, key: "4" }],
  ["path", { d: "M7 22L12 17L17 22", ...stroke, key: "5" }],
];

const UnfoldVerticalIcon: IconSvgElement = [
  ...foldDashes,
  ["path", { d: "M7 7L12 2L17 7", ...stroke, key: "4" }],
  ["path", { d: "M7 17L12 22L17 17", ...stroke, key: "5" }],
];

export const AlertCircle = wrap(AlertCircleIcon, "AlertCircle");
export const AppWindow = wrap(AppWindowIcon, "AppWindow");
export const Archive = wrap(Archive02Icon, "Archive");
export const ArrowDownCircle = wrap(CircleArrowDown01Icon, "ArrowDownCircle");
export const ArrowLeft = wrap(ArrowLeft01Icon, "ArrowLeft");
export const ArrowUp = wrap(ArrowUp01Icon, "ArrowUp");
export const Bot = wrap(BotIcon, "Bot");
export const AiIdea = wrap(AiIdeaIcon, "AiIdea");
export const CaseSensitive = wrap(CaseSensitiveIcon, "CaseSensitive");
export const Chatting = wrap(Chatting01Icon, "Chatting");
export const Check = wrap(Tick02Icon, "Check");
export const CheckCheck = wrap(TickDouble02Icon, "CheckCheck");
export const CheckCircle = wrap(CheckmarkCircle02Icon, "CheckCircle");
export const ChevronDown = wrap(ArrowDown01Icon, "ChevronDown");
export const ChevronLeft = wrap(ArrowLeft01Icon, "ChevronLeft");
export const ChevronRight = wrap(ArrowRight01Icon, "ChevronRight");
export const CornerDownRight = wrap(ArrowTurnForwardIcon, "CornerDownRight");
export const ChevronUp = wrap(ArrowUp01Icon, "ChevronUp");
export const CircleAlert = wrap(AlertCircleIcon, "CircleAlert");
export const CircleDashed = wrap(CircleDashedIcon, "CircleDashed");
export const CircleDot = wrap(CircleDotIcon, "CircleDot");
export const CircleHelp = wrap(HelpCircleIcon, "CircleHelp");
export const CircleX = wrap(CancelCircleIcon, "CircleX");
export const CloudUpload = wrap(CloudUploadIcon, "CloudUpload");
export const Clock = wrap(Clock01Icon, "Clock");
export const Copy = wrap(Copy01Icon, "Copy");
export const CursorMagicSelection = wrap(
  CursorMagicSelection04Icon,
  "CursorMagicSelection",
);
export const DashboardSquare = wrap(DashboardSquare01Icon, "DashboardSquare");
export const ExternalLink = wrap(LinkSquare02Icon, "ExternalLink");
export const File = wrap(File01Icon, "File");
export const FileDiff = wrap(FileDiffIcon, "FileDiff");
export const FilePlus = wrap(FileAddIcon, "FilePlus");
export const FilePlusCorner = wrap(FilePlusCornerIcon, "FilePlusCorner");
export const FileScript = wrap(FileScriptIcon, "FileScript");
export const FoldVertical = wrap(FoldVerticalIcon, "FoldVertical");
export const Folder = wrap(Folder01Icon, "Folder");
export const FolderOpen = wrap(FolderOpenIcon, "FolderOpen");
export const Eye = wrap(ViewIcon, "Eye");
export const FolderPlus = wrap(FolderAddIcon, "FolderPlus");
export const FolderTree = wrap(FolderTreeIcon, "FolderTree");
export const Gauge = wrap(GaugeIcon, "Gauge");
export const ChartBreakoutSquare = wrap(
  ChartBreakoutSquareIcon,
  "ChartBreakoutSquare",
);
export const GitBranch = wrap(GitBranchIcon, "GitBranch");
export const GitFork = wrap(GitForkIcon, "GitFork");
export const Paperclip = wrap(Attachment01Icon, "Paperclip");
export const GitCompare = wrap(GitCompareIcon, "GitCompare");
export const GitMerge = wrap(GitMergeIcon, "GitMerge");
export const GitPullRequest = wrap(GitPullRequestIcon, "GitPullRequest");
export const GitPullRequestClosed = wrap(
  GitPullRequestClosedIcon,
  "GitPullRequestClosed",
);
export const GitPullRequestDraft = wrap(
  GitPullRequestDraftIcon,
  "GitPullRequestDraft",
);
export const GripVertical = wrap(DragDropVerticalIcon, "GripVertical");
export const Globe = wrap(GlobeIcon, "Globe");
export const Internet = wrap(InternetIcon, "Internet");
export const ImagePlus = wrap(ImageAdd01Icon, "ImagePlus");
export const Inbox = wrap(InboxIcon, "Inbox");
export const BellOff = wrap(NotificationOff01Icon, "BellOff");
export const Keyboard = wrap(KeyboardIcon, "Keyboard");
export const ListBullet = wrap(LeftToRightListBulletIcon, "ListBullet");
export const ListEnd = wrap(ListEndIcon, "ListEnd");
export const ListFilter = wrap(FilterIcon, "ListFilter");
export const Loader = wrap(Loading03Icon, "Loader");
export const LoaderCircle = wrap(Loading03Icon, "LoaderCircle");
export const Lock = wrap(SquareLock02Icon, "Lock");
export const Maximize2 = wrap(ArrowExpand01Icon, "Maximize2");
export const MessageMultiple = wrap(MessageMultiple01Icon, "MessageMultiple");
export const MessageSquare = wrap(Comment01Icon, "MessageSquare");
export const MessageSquarePlus = wrap(CommentAdd01Icon, "MessageSquarePlus");
export const Minus = wrap(MinusSignIcon, "Minus");
export const MoreHorizontal = wrap(MoreHorizontalIcon, "MoreHorizontal");
export const Palette = wrap(PaintBoardIcon, "Palette");
export const Pause = wrap(PauseIcon, "Pause");
export const PanelBottom = wrap(LayoutBottomIcon, "PanelBottom");
export const PanelLeft = wrap(LayoutAlignRightIcon, "PanelLeft");
export const PanelRight = wrap(SidebarRight01Icon, "PanelRight");
export const PanelTop = wrap(LayoutTopIcon, "PanelTop");
export const PenLine = wrap(PencilEdit01Icon, "PenLine");
export const Pencil = wrap(PencilEdit02Icon, "Pencil");
export const Pin = wrap(PinIcon, "Pin");
export const PinOff = wrap(PinOffIcon, "PinOff");
export const Play = wrap(PlayIcon, "Play");
export const Pipette = wrap(ColorPickerIcon, "Pipette");
export const Plus = wrap(Add01Icon, "Plus");
export const RefreshCw = wrap(Refresh01Icon, "RefreshCw");
export const Regex = wrap(RegexIcon, "Regex");
export const Replace = wrap(ReplaceIcon, "Replace");
export const RotateCcw = wrap(RotateCcwIcon, "RotateCcw");
export const Search = wrap(Search01Icon, "Search");
export const Settings = wrap(Settings01Icon, "Settings");
export const Share = wrap(Share02Icon, "Share");
export const Shield = wrap(ShieldAlertIcon, "Shield");
export const SlidersHorizontal = wrap(
  PreferenceHorizontalIcon,
  "SlidersHorizontal",
);
export const Sparkles = wrap(SparklesIcon, "Sparkles");
export const Square = wrap(SquareIcon, "Square");
export const SquarePlus = wrap(AddSquareIcon, "SquarePlus");
export const Star = wrap(StarIcon, "Star");
export const StickyNote = wrap(Note01Icon, "StickyNote");
export const Terminal = wrap(ComputerTerminal01Icon, "Terminal");
export const Trash2 = wrap(Delete02Icon, "Trash2");
export const Undo2 = wrap(UndoIcon, "Undo2");
export const UnfoldVertical = wrap(UnfoldVerticalIcon, "UnfoldVertical");
export const Ungroup = wrap(UngroupItemsIcon, "Ungroup");
export const WandSparkles = wrap(MagicWand01Icon, "WandSparkles");
export const WholeWord = wrap(WholeWordIcon, "WholeWord");
export const Wrench = wrap(Wrench01Icon, "Wrench");
export const X = wrap(Cancel01Icon, "X");
export const Zap = wrap(FlashIcon, "Zap");
