import type { IconType } from "react-icons";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

const icons: Record<string, IconType> = {
  Instagram: FaInstagram,
  Facebook: FaFacebookF,
  X: FaXTwitter,
  TikTok: FaTiktok,
  YouTube: FaYoutube,
  LinkedIn: FaLinkedinIn,
  WhatsApp: FaWhatsapp,
};

export default function SocialIcons({
  socials,
}: {
  socials: { name: string; url: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {socials.map((social) => {
        const Icon = icons[social.name];

        if (!Icon) return null;

        const hasUrl = social.url.trim() !== "";

        return (
          <a
            key={social.name}
            href={hasUrl ? social.url : "#"}
            aria-label={social.name}
            {...(hasUrl
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-signal hover:bg-signal"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}