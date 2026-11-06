/**
 * The app's only icon source: Font Awesome 7 Free (solid / regular / brands).
 * Exports keep the names the app already uses, so call sites stay `<Search className="size-4" />`.
 */
import type { ComponentProps, ComponentType, MouseEventHandler } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
// Named imports only: next.config modularizeImports maps each to its own file (no 1MB pack index).
import { faArrowLeft, faArrowRight, faArrowUpRightFromSquare, faArrowsRotate, faAt, faBars, faBell, faBookOpen, faBookmark, faBox, faCalendar, faCheck, faCheckDouble, faChevronDown, faChevronRight, faChevronUp, faCircleCheck, faCircleExclamation, faCircleNotch, faCirclePlay, faCircleUser, faCircleXmark, faClock, faClockRotateLeft, faCoins, faComment, faCopy, faCreditCard, faCrown, faDownload, faDumbbell, faEllipsisVertical, faEnvelope, faExpand, faEye, faFaceSmile, faFileCircleQuestion, faFileLines, faFire, faFlag, faFont, faGamepad, faGear, faGenderless, faGlobe, faHeart, faImage, faIndianRupeeSign, faKey, faLaptop, faLocationDot, faLock, faMagnifyingGlass, faMagnifyingGlassMinus, faMagnifyingGlassPlus, faMars, faMessage, faMobileScreen, faMoon, faMugHot, faMusic, faPalette, faPaperPlane, faPause, faPen, faPencil, faPhone, faPlane, faPlay, faQrcode, faReceipt, faRightFromBracket, faRightToBracket, faRocket, faRotateLeft, faRotateRight, faShareNodes, faShield, faShieldHalved, faShirt, faSun, faTableCellsLarge, faTowerBroadcast, faTrashCan, faTriangleExclamation, faTrophy, faUser, faUsers, faUtensils, faVenus, faVideo, faVolumeHigh, faVolumeXmark, faWandMagicSparkles, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular, faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import {
  faApple as faAppleBrand,
  faDiscord as faDiscordBrand,
  faFacebook as faFacebookBrand,
  faGoogle as faGoogleBrand,
  faGooglePlay as faGooglePlayBrand,
  faInstagram as faInstagramBrand,
  faLinkedin as faLinkedinBrand,
  faQuora as faQuoraBrand,
  faRedditAlien as faRedditAlienBrand,
  faSnapchat as faSnapchatBrand,
  faTelegram as faTelegramBrand,
  faThreads as faThreadsBrand,
  faXTwitter as faXTwitterBrand,
  faYoutube as faYoutubeBrand,
} from '@fortawesome/free-brands-svg-icons';
import { cn } from '@/lib/utils';

export type IconProps = {
  className?: string;
  style?: ComponentProps<typeof FontAwesomeIcon>['style'];
  size?: number | string;
  /** Any value other than 'none' (or a `fill-*` class) renders the solid variant of outline icons. */
  fill?: string;
  strokeWidth?: number;
  title?: string;
  onClick?: MouseEventHandler<SVGSVGElement>;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
};
export type IconComponent = ComponentType<IconProps>;

/** `outline` is used until the icon is filled, matching the old stroke-icon toggle behaviour. */
function fa(icon: IconDefinition, outline?: IconDefinition): IconComponent {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strokeWidth is a stroke-icon prop; FA glyphs ignore it
  function Icon({ className, style, size, fill, strokeWidth, ...rest }: IconProps) {
    const filled = (fill !== undefined && fill !== 'none') || /\bfill-(?!none\b)/.test(className ?? '');
    return (
      <FontAwesomeIcon
        icon={outline && !filled ? outline : icon}
        // size-6 = the previous 24px default; any size/h/w class passed in wins.
        className={cn('size-6 shrink-0', className)}
        style={size !== undefined ? { width: size, height: size, ...style } : style}
        {...rest}
      />
    );
  }
  Icon.displayName = `Icon(${icon.iconName})`;
  return Icon;
}

// UI
export const AlertCircle = fa(faCircleExclamation);
export const AlertTriangle = fa(faTriangleExclamation);
export const ArrowLeft = fa(faArrowLeft);
export const ArrowRight = fa(faArrowRight);
export const AtSign = fa(faAt);
export const Bell = fa(faBell);
export const Bookmark = fa(faBookmark, faBookmarkRegular);
export const BookOpen = fa(faBookOpen);
export const Calendar = fa(faCalendar);
export const Check = fa(faCheck);
export const CheckCheck = fa(faCheckDouble);
const CheckCircle = fa(faCircleCheck);
export const CheckCircle2 = CheckCircle;
export const ChevronDown = fa(faChevronDown);
export const ChevronRight = fa(faChevronRight);
export const ChevronUp = fa(faChevronUp);
export const Clock = fa(faClock);
export const Coffee = fa(faMugHot);
export const Coins = fa(faCoins);
export const Copy = fa(faCopy);
export const CreditCard = fa(faCreditCard);
export const Crown = fa(faCrown);
export const Download = fa(faDownload);
export const Dumbbell = fa(faDumbbell);
export const ExternalLink = fa(faArrowUpRightFromSquare);
export const Eye = fa(faEye);
export const FileQuestion = fa(faFileCircleQuestion);
export const FileText = fa(faFileLines);
export const Flag = fa(faFlag);
export const Flame = fa(faFire);
export const Gamepad2 = fa(faGamepad);
export const Globe = fa(faGlobe);
export const Heart = fa(faHeart, faHeartRegular);
export const History = fa(faClockRotateLeft);
export const Image = fa(faImage);
export const IndianRupee = fa(faIndianRupeeSign); // image-slash is Pro-only
export const Key = fa(faKey);
export const KeyRound = Key;
export const Laptop = fa(faLaptop);
export const LayoutGrid = fa(faTableCellsLarge);
export const Loader2 = fa(faCircleNotch);
export const Lock = fa(faLock);
export const LogIn = fa(faRightToBracket);
export const LogOut = fa(faRightFromBracket);
export const Mail = fa(faEnvelope);
export const MapPin = fa(faLocationDot);
export const Maximize = fa(faExpand);
export const Menu = fa(faBars);
export const MessageCircle = fa(faComment);
export const MessageSquare = fa(faMessage);
export const Moon = fa(faMoon);
export const MoreVertical = fa(faEllipsisVertical);
export const Music = fa(faMusic);
export const Package = fa(faBox);
export const Palette = fa(faPalette);
export const Pause = fa(faPause);
export const Pencil = fa(faPencil);
export const PenLine = fa(faPen);
export const Phone = fa(faPhone);
export const Plane = fa(faPlane);
export const Play = fa(faPlay);
export const PlayCircle = fa(faCirclePlay);
export const QrCode = fa(faQrcode);
export const Radio = fa(faTowerBroadcast);
export const Receipt = fa(faReceipt);
export const RefreshCw = fa(faArrowsRotate);
export const Rocket = fa(faRocket);
export const RotateCcw = fa(faRotateLeft);
export const RotateCw = fa(faRotateRight);
export const Search = fa(faMagnifyingGlass);
export const Send = fa(faPaperPlane);
export const Settings = fa(faGear);
export const Share2 = fa(faShareNodes);
export const Shield = fa(faShield);
export const ShieldAlert = fa(faTriangleExclamation);
export const ShieldCheck = fa(faShieldHalved);
export const Shirt = fa(faShirt);
export const Smartphone = fa(faMobileScreen);
export const Smile = fa(faFaceSmile);
export const Sparkles = fa(faWandMagicSparkles);
export const Sun = fa(faSun);
export const Trash2 = fa(faTrashCan);
export const Trophy = fa(faTrophy);
export const Type = fa(faFont);
export const User = fa(faUser);
export const UserRound = fa(faCircleUser);
export const Users = fa(faUsers);
export const UtensilsCrossed = fa(faUtensils);
export const Video = fa(faVideo);
export const Volume2 = fa(faVolumeHigh);
export const VolumeX = fa(faVolumeXmark);
export const X = fa(faXmark);
export const XCircle = fa(faCircleXmark);
export const ZoomIn = fa(faMagnifyingGlassPlus);
export const ZoomOut = fa(faMagnifyingGlassMinus);
export const Mars = fa(faMars);
export const Venus = fa(faVenus);
export const Genderless = fa(faGenderless);

// Brands
export const Apple = fa(faAppleBrand);
export const Discord = fa(faDiscordBrand);
export const Facebook = fa(faFacebookBrand);
export const Google = fa(faGoogleBrand);
export const GooglePlay = fa(faGooglePlayBrand);
export const Instagram = fa(faInstagramBrand);
export const Linkedin = fa(faLinkedinBrand);
export const Quora = fa(faQuoraBrand);
export const Reddit = fa(faRedditAlienBrand);
export const Snapchat = fa(faSnapchatBrand);
export const Telegram = fa(faTelegramBrand);
export const Threads = fa(faThreadsBrand);
export const Twitter = fa(faXTwitterBrand);
export const XTwitter = Twitter;
export const Youtube = fa(faYoutubeBrand);
