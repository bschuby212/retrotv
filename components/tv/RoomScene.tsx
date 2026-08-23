import Image from "next/image";
import { RetroTV } from "@/components/tv/RetroTV";
import sceneStyles from "@/styles/tv/room-scene.module.css";

export function RoomScene() {
  return (
    <div className={sceneStyles.scene}>
      <Image
        src="/images/room-background.jpg"
        alt=""
        fill
        priority
        className={sceneStyles.background}
        sizes="100vw"
        aria-hidden="true"
      />
      <div className={sceneStyles.tvMount}>
        <div className={sceneStyles.ambientShadow} aria-hidden="true" />
        <div className={sceneStyles.contactShadow} aria-hidden="true" />
        <RetroTV />
      </div>
    </div>
  );
}
