import transitionStyles from "@/styles/tv/transitions.module.css";

interface StaticTransitionProps {
  active: boolean;
}

export function StaticTransition({ active }: StaticTransitionProps) {
  if (!active) return null;

  return (
    <div
      className={`${transitionStyles.static} ${transitionStyles.staticActive}`}
      aria-hidden="true"
    >
      <div className={transitionStyles.noise} />
      <div className={transitionStyles.glitch} />
      <div className={transitionStyles.blackFrame} />
    </div>
  );
}
