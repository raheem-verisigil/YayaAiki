import { useEffect } from "react";
import referenceMarkup from "./reference-body";

export default function ReferenceHome() {
  useEffect(() => {
    const menuButton = document.querySelector<HTMLButtonElement>(".menu-toggle");
    const links = document.querySelector<HTMLElement>("nav.links");
    if (!menuButton || !links) return;

    const toggleMenu = () => {
      const open = links.style.display === "flex";
      links.style.display = open ? "none" : "flex";
      if (!open) {
        Object.assign(links.style, {
          position: "absolute",
          top: "60px",
          left: "0",
          right: "0",
          background: "var(--navy)",
          flexDirection: "column",
          padding: "20px 28px",
          gap: "16px",
          borderBottom: "1px solid var(--navy-line)",
        });
      }
    };

    menuButton.addEventListener("click", toggleMenu);
    return () => menuButton.removeEventListener("click", toggleMenu);
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: referenceMarkup }} />;
}
