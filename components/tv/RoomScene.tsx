import { RetroTV } from "@/components/tv/RetroTV";
import sceneStyles from "@/styles/tv/room-scene.module.css";

export function RoomScene() {
  return (
    <div className={sceneStyles.scene}>
      <div className={sceneStyles.backgroundWrap}>
        <img
          src="/images/room-background.jpg"
          className={sceneStyles.background}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>
      <div className={sceneStyles.tvMount}>
        <div className={sceneStyles.ambientShadow} aria-hidden="true" />
        <div className={sceneStyles.contactShadow} aria-hidden="true" />
        <RetroTV />
      </div>
    </div>
  );
}
