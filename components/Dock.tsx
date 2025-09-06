"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  MotionValue,
} from "framer-motion";
import { Children, cloneElement, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  active = false,
  position,
  label,
}: {
  children: React.ReactElement | React.ReactElement[];
  className?: string;
  onClick: () => void;
  mouseX: MotionValue<number>;
  spring: SpringCfg;
  distance: number;
  magnification: number;
  baseItemSize: number;
  active?: boolean;
  position?: DockProps["position"];
  label: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? ({ x: 0 } as DOMRect);
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  const lift = useTransform(
    size,
    [baseItemSize, magnification],
    [0, position === "bottom" ? -5 : 5]
  );

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size, y: lift }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={clsx("dock-item", active && "dock-active", className)}
      tabIndex={0}
      role="link"
      aria-current={active ? "page" : undefined}
      aria-label={label}
    >
      {Children.map(children, (child) =>
        cloneElement(child as any, { isHovered, position })
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = "", ...rest }: any) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsub = isHovered.on("change", (latest: number) => {
      setIsVisible(latest === 1);
    });
    return () => unsub && unsub();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={["dock-label", className].join(" ")}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "w-4 h-4" }) {
  return <div className={["dock-icon", className].join(" ")}>{children}</div>;
}

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50,
  position = "bottom",
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <motion.div className="dock-outer">
      <motion.div
        // pointer events work on desktop; mobile will just tap
        onMouseMove={(e) => {
          isHovered.set(1);
          mouseX.set(e.pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={[
          position === "top"
            ? "dock-top dock-panel-top"
            : "dock-bottom dock-panel-bottom",
          className,
        ].join(" ")}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => {
          const isActive =
            pathname === item.href ||
            (pathname?.startsWith(item.href + "/") ?? false);

          return (
            <DockItem
              key={index}
              onClick={() => router.push(item.href)}
              className={item.className}
              mouseX={mouseX}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
              active={isActive}
              position={position}
              label={item.label}
            >
              <DockIcon>{item.icon}</DockIcon>
              <DockLabel>{item.label}</DockLabel>
            </DockItem>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
