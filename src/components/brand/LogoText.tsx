"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface LogoTextProps {
  className?: string;
  delay?: number;
  active?: boolean;
}

export const LogoText: React.FC<LogoTextProps> = ({ className, delay = 0, active: forceActive = true }) => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Add a tiny delay to ensure the browser registers the initial 0-state before animating
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const active = forceActive && isReady;

  return (
    <div className={cn("relative flex items-center justify-center overflow-visible select-none", className)}>
      <style>
        {`
          .logo-svg .svg-elem-1 {
            stroke-dashoffset: 11350.25390625px;
            stroke-dasharray: 11350.25390625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.8}s;
          }
          .logo-svg.active .svg-elem-1 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-2 {
            stroke-dashoffset: 5329.35302734375px;
            stroke-dasharray: 5329.35302734375px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.05}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.85}s;
          }
          .logo-svg.active .svg-elem-2 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-3 {
            stroke-dashoffset: 8739.712890625px;
            stroke-dasharray: 8739.712890625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.1}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.9}s;
          }
          .logo-svg.active .svg-elem-3 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-4 {
            stroke-dashoffset: 6714.6015625px;
            stroke-dasharray: 6714.6015625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.15}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.95}s;
          }
          .logo-svg.active .svg-elem-4 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-5 {
            stroke-dashoffset: 6026.978515625px;
            stroke-dasharray: 6026.978515625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.2}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1}s;
          }
          .logo-svg.active .svg-elem-5 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-6 {
            stroke-dashoffset: 10381.4833984375px;
            stroke-dasharray: 10381.4833984375px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.25}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.05}s;
          }
          .logo-svg.active .svg-elem-6 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-7 {
            stroke-dashoffset: 8488.7412109375px;
            stroke-dasharray: 8488.7412109375px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.3}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.1}s;
          }
          .logo-svg.active .svg-elem-7 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-8 {
            stroke-dashoffset: 8499.580078125px;
            stroke-dasharray: 8499.580078125px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.35}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.15}s;
          }
          .logo-svg.active .svg-elem-8 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-9 {
            stroke-dashoffset: 3722px;
            stroke-dasharray: 3722px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.4}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.2}s;
          }
          .logo-svg.active .svg-elem-9 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-10 {
            stroke-dashoffset: 1301.3704833984375px;
            stroke-dasharray: 1301.3704833984375px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.45}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.25}s;
          }
          .logo-svg.active .svg-elem-10 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-11 {
            stroke-dashoffset: 8510.4580078125px;
            stroke-dasharray: 8510.4580078125px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.5}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.3}s;
          }
          .logo-svg.active .svg-elem-11 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-12 {
            stroke-dashoffset: 6021.01708984375px;
            stroke-dasharray: 6021.01708984375px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.55}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.35}s;
          }
          .logo-svg.active .svg-elem-12 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-13 {
            stroke-dashoffset: 8702.4404296875px;
            stroke-dasharray: 8702.4404296875px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.6}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.4}s;
          }
          .logo-svg.active .svg-elem-13 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-14 {
            stroke-dashoffset: 8005.88134765625px;
            stroke-dasharray: 8005.88134765625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.65}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.45}s;
          }
          .logo-svg.active .svg-elem-14 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-15 {
            stroke-dashoffset: 6018.02197265625px;
            stroke-dasharray: 6018.02197265625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.7}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.5}s;
          }
          .logo-svg.active .svg-elem-15 { stroke-dashoffset: 0; fill: rgb(255, 255, 255); }

          .logo-svg .svg-elem-16 {
            stroke-dashoffset: 8682px;
            stroke-dasharray: 8682px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.75}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.55}s;
          }
          .logo-svg.active .svg-elem-16 { stroke-dashoffset: 0; fill: rgb(50, 200, 255); }

          .logo-svg .svg-elem-17 {
            stroke-dashoffset: 7638.6494140625px;
            stroke-dasharray: 7638.6494140625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.8}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.6}s;
          }
          .logo-svg.active .svg-elem-17 { stroke-dashoffset: 0; fill: rgb(50, 200, 255); }

          .logo-svg .svg-elem-18 {
            stroke-dashoffset: 5291.3603515625px;
            stroke-dasharray: 5291.3603515625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.85}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.65}s;
          }
          .logo-svg.active .svg-elem-18 { stroke-dashoffset: 0; fill: rgb(50, 200, 255); }

          .logo-svg .svg-elem-19 {
            stroke-dashoffset: 17446.423828125px;
            stroke-dasharray: 17446.423828125px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.9}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.7}s;
          }
          .logo-svg.active .svg-elem-19 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-20 {
            stroke-dashoffset: 3742px;
            stroke-dasharray: 3742px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 0.95}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.75}s;
          }
          .logo-svg.active .svg-elem-20 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-21 {
            stroke-dashoffset: 1300.5067138671875px;
            stroke-dasharray: 1300.5067138671875px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.8}s;
          }
          .logo-svg.active .svg-elem-21 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-22 {
            stroke-dashoffset: 4822px;
            stroke-dasharray: 4822px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.05}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.85}s;
          }
          .logo-svg.active .svg-elem-22 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-23 {
            stroke-dashoffset: 10075.8076171875px;
            stroke-dasharray: 10075.8076171875px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.1}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.9}s;
          }
          .logo-svg.active .svg-elem-23 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-24 {
            stroke-dashoffset: 11795.25390625px;
            stroke-dasharray: 11795.25390625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.15}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.95}s;
          }
          .logo-svg.active .svg-elem-24 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-25 {
            stroke-dashoffset: 3722.0712890625px;
            stroke-dasharray: 3722.0712890625px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.2}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 2}s;
          }
          .logo-svg.active .svg-elem-25 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-26 {
            stroke-dashoffset: 1298.940673828125px;
            stroke-dasharray: 1298.940673828125px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.25}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 2.05}s;
          }
          .logo-svg.active .svg-elem-26 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-27 {
            stroke-dashoffset: 6723.63720703125px;
            stroke-dasharray: 6723.63720703125px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.3}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 2.1}s;
          }
          .logo-svg.active .svg-elem-27 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-28 {
            stroke-dashoffset: 6046.43310546875px;
            stroke-dasharray: 6046.43310546875px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.35}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 2.15}s;
          }
          .logo-svg.active .svg-elem-28 { stroke-dashoffset: 0; fill: rgb(200, 155, 60); }

          .logo-svg .svg-elem-29 {
            stroke-dashoffset: 1394.8450927734375px;
            stroke-dasharray: 1394.8450927734375px;
            fill: transparent;
            transition: stroke-dashoffset 1s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 1.4}s,
                        fill 0.7s cubic-bezier(0.47, 0, 0.745, 0.715) ${delay + 2.2}s;
          }
          .logo-svg.active .svg-elem-29 { stroke-dashoffset: 0; fill: rgb(50, 200, 255); }
        `}
      </style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay }}
        className="w-full h-full flex items-center justify-center pt-1"
      >
        <svg
          viewBox="0 0 2000 554"
          className={cn("logo-svg w-full h-full overflow-visible", active && "active")}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform="translate(0,554) scale(0.1,-0.1)" strokeWidth="10" strokeLinejoin="round">
            {/* DRAFT ASSISTANT - WHITE */}
            <g fill="none" stroke="#FFFFFF">
              <path className="svg-elem-1" d="M190 4400 l0 -1022 438 4 c399 4 448 7 562 27 374 68 576 186 716 419 101 168 149 501 109 762 -32 212 -111 366 -261 511 -149 143 -359 240 -625 290 -101 19 -161 22 -526 26 l-413 5 0 -1022z m945 672 c174 -47 312 -140 393 -264 83 -128 114 -286 101 -514 -12 -199 -66 -340 -168 -438 -138 -131 -323 -176 -723 -176 l-178 0 0 711 0 711 248 -4 c212 -4 258 -8 327 -26z" />
              <path className="svg-elem-2" d="M2240 4125 l0 -745 184 0 185 0 3 383 c4 332 7 389 22 436 58 178 170 236 499 257 l97 6 0 204 0 204 -67 0 c-153 -1 -290 -51 -391 -145 -66 -61 -101 -112 -137 -201 l-22 -53 -11 177 c-7 97 -12 187 -12 200 0 22 0 22 -175 22 l-175 0 0 -745z" />
              <path className="svg-elem-3" d="M3733 4856 c-178 -44 -303 -179 -367 -398 -75 -258 -55 -626 45 -836 67 -139 212 -249 359 -272 256 -40 476 45 589 227 l28 45 21 -78 c11 -44 26 -98 32 -121 l11 -43 159 0 160 0 0 745 0 745 -190 0 -190 0 0 -152 0 -152 -36 60 c-69 115 -171 194 -293 226 -79 20 -251 22 -328 4z m386 -316 c81 -14 130 -39 175 -91 74 -87 109 -266 88 -448 -19 -166 -71 -265 -163 -311 -61 -32 -167 -45 -250 -31 -88 14 -135 38 -183 91 -70 78 -99 181 -99 355 1 261 90 403 273 434 76 12 86 12 159 1z" />
              <path className="svg-elem-4" d="M5320 5473 c-51 -8 -134 -58 -167 -101 -53 -69 -65 -125 -70 -324 l-5 -178 -99 0 -99 0 0 -130 0 -130 100 0 100 0 0 -620 0 -620 185 0 185 0 0 620 0 620 185 0 185 0 0 130 0 130 -185 0 -185 0 2 163 3 162 188 3 187 2 0 140 0 140 -242 -1 c-134 -1 -254 -4 -268 -6z" />
              <path className="svg-elem-5" d="M6240 5188 c0 -91 -18 -187 -43 -233 -27 -50 -74 -74 -161 -82 l-66 -6 0 -128 0 -129 110 0 110 0 0 -422 c0 -233 5 -463 10 -512 14 -116 46 -186 109 -231 76 -56 129 -65 369 -65 l212 0 0 145 0 145 -175 0 -175 0 0 470 0 470 170 0 170 0 0 130 0 130 -170 0 -170 0 0 190 0 190 -150 0 -150 0 0 -62z" />
              <path className="svg-elem-6" d="M8381 5353 c-11 -38 -158 -495 -325 -1018 l-304 -950 186 -3 c103 -1 191 -1 197 2 6 2 49 130 95 285 l85 281 399 -2 399 -3 86 -282 86 -283 197 0 c109 0 198 1 198 3 0 1 -150 459 -334 1017 l-333 1015 -306 3 -305 2 -21 -67z m639 -1105 c0 -5 -137 -8 -305 -8 -234 0 -305 3 -305 12 0 11 160 549 272 913 l30 100 154 -505 c84 -278 154 -508 154 -512z" />
              <path className="svg-elem-7" d="M10285 4913 c-146 -13 -298 -71 -381 -146 -119 -107 -148 -317 -66 -470 65 -121 199 -196 496 -277 271 -74 341 -110 366 -186 26 -79 -9 -147 -98 -191 -52 -26 -66 -28 -172 -28 -127 0 -185 18 -244 73 -32 30 -76 116 -76 149 0 53 0 53 -176 53 -131 0 -166 -3 -170 -14 -9 -24 17 -138 44 -196 41 -86 158 -196 262 -248 302 -149 716 -110 902 84 65 68 83 122 83 249 0 137 -20 188 -104 268 -91 87 -185 128 -461 202 -187 50 -248 73 -297 111 -95 72 -81 193 27 254 42 23 55 25 175 25 114 0 136 -3 180 -23 90 -41 135 -98 144 -181 l6 -56 170 0 170 0 -4 60 c-19 323 -342 526 -776 488z" />
              <path className="svg-elem-8" d="M11680 4913 c-165 -17 -320 -82 -398 -168 -68 -74 -87 -131 -87 -260 0 -87 4 -107 26 -156 71 -152 192 -224 529 -314 246 -66 326 -107 350 -181 26 -79 -9 -147 -98 -191 -53 -26 -65 -28 -177 -27 -133 1 -168 11 -230 66 -43 37 -71 89 -86 158 l-11 50 -164 0 c-137 0 -166 -3 -170 -15 -10 -25 14 -136 43 -195 41 -86 159 -197 263 -248 138 -67 220 -86 390 -86 115 0 163 5 232 22 165 41 282 121 335 231 25 51 28 66 28 166 0 100 -2 115 -28 167 -17 34 -50 77 -84 108 -91 83 -182 122 -453 195 -242 65 -311 98 -346 167 -23 44 -14 121 17 154 53 58 93 69 234 69 114 0 136 -3 180 -23 90 -41 133 -97 144 -187 l6 -50 169 -3 169 -2 -6 80 c-14 208 -179 386 -412 444 -115 29 -256 40 -365 29z" />
              <path className="svg-elem-9" d="M12680 4125 l0 -745 185 0 185 0 0 745 0 745 -185 0 -185 0 0 -745z" />
              <path className="svg-elem-10" d="M12800 5459 c-59 -11 -90 -35 -117 -89 -38 -73 -26 -197 24 -252 47 -53 161 -71 248 -41 41 15 54 26 75 63 21 38 25 58 25 125 0 134 -43 186 -160 198 -27 3 -70 1 -95 -4z" />
              <path className="svg-elem-11" d="M13730 4908 c-216 -26 -379 -131 -432 -276 -27 -74 -24 -222 6 -294 65 -158 180 -228 533 -323 284 -77 353 -122 353 -232 0 -44 -5 -58 -30 -86 -43 -50 -119 -79 -215 -85 -197 -11 -314 64 -350 222 l-11 51 -167 3 -167 2 0 -44 c0 -69 36 -168 84 -233 79 -108 202 -187 373 -240 80 -25 102 -27 243 -26 126 0 170 4 235 22 243 65 357 189 359 391 1 103 -20 171 -74 238 -77 98 -198 157 -479 232 -114 31 -215 65 -261 88 -66 32 -78 43 -98 84 -32 63 -24 116 24 163 44 44 115 65 219 65 200 0 315 -76 332 -219 l6 -51 170 0 170 0 -6 68 c-32 338 -367 536 -817 480z" />
              <path className="svg-elem-12" d="M14897 5152 c-12 -181 -50 -250 -147 -271 -28 -6 -67 -11 -85 -11 l-35 0 0 -130 0 -130 109 0 110 0 3 -492 c3 -482 4 -494 25 -548 31 -77 74 -124 141 -157 57 -28 57 -28 295 -31 l238 -4 -3 144 -3 143 -172 3 -173 2 0 470 0 470 170 0 170 0 0 130 0 130 -170 0 -170 0 0 190 0 190 -148 0 -149 0 -6 -98z" />
              <path className="svg-elem-13" d="M16120 4859 c-25 -5 -77 -25 -117 -44 -131 -65 -218 -187 -270 -382 -25 -92 -27 -112 -27 -328 -1 -210 1 -238 22 -320 49 -189 147 -327 272 -388 220 -107 525 -60 673 104 31 33 62 74 70 91 8 16 17 26 19 22 3 -5 18 -60 34 -121 l29 -113 157 0 158 0 0 745 0 745 -190 0 -190 0 0 -147 0 -148 -32 53 c-63 110 -176 193 -303 227 -64 16 -229 19 -305 4z m455 -343 c136 -62 193 -202 182 -454 -11 -293 -107 -407 -342 -406 -208 1 -308 90 -346 310 -17 99 -7 273 22 357 26 78 88 156 150 188 85 43 243 46 334 5z" />
              <path className="svg-elem-14" d="M17330 4125 l0 -745 184 0 184 0 5 413 c5 444 9 482 61 586 33 64 106 127 169 146 65 19 189 19 253 0 57 -17 115 -68 146 -129 42 -83 48 -147 48 -593 l0 -423 185 0 185 0 0 383 c0 570 -17 728 -91 868 -37 68 -126 156 -192 188 -76 37 -180 54 -292 48 -164 -9 -268 -57 -370 -169 -30 -33 -62 -80 -72 -104 -10 -24 -21 -44 -24 -44 -3 0 -18 66 -33 148 -15 81 -29 153 -31 160 -3 9 -44 12 -160 12 l-155 0 0 -745z" />
              <path className="svg-elem-15" d="M19123 5128 c-19 -194 -56 -242 -197 -255 l-66 -6 0 -128 0 -129 110 0 110 0 0 -458 c0 -288 4 -480 11 -517 21 -114 73 -184 169 -229 41 -19 67 -21 283 -24 l238 -4 -3 144 -3 143 -172 3 -173 2 0 470 0 470 170 0 170 0 0 130 0 130 -170 0 -170 0 0 190 0 190 -148 0 -148 0 -11 -122z" />
            </g>

            {/* FOR - BLUE */}
            <g fill="none" stroke="#32C8FF">
              <path className="svg-elem-16" d="M1570 1155 l0 -1025 180 0 180 0 0 465 0 465 420 0 420 0 0 150 0 150 -420 0 -420 0 0 250 0 250 545 0 545 0 0 160 0 160 -725 0 -725 0 0 -1025z" />
              <path className="svg-elem-17" d="M3550 1619 c-296 -35 -504 -206 -588 -481 -48 -154 -50 -364 -7 -533 47 -184 175 -345 335 -423 136 -67 188 -77 390 -77 196 1 253 11 375 70 172 83 288 233 340 439 31 123 38 234 25 356 -38 344 -227 572 -528 634 -91 19 -251 26 -342 15z m232 -290 c191 -41 280 -184 282 -454 0 -174 -30 -279 -106 -361 -68 -74 -151 -104 -286 -104 -221 0 -337 104 -378 340 -39 224 25 444 153 529 42 28 67 38 138 54 39 9 145 7 197 -4z" />
              <path className="svg-elem-18" d="M4635 1618 c-3 -7 -4 -344 -3 -748 l3 -735 183 -3 182 -2 0 312 c0 457 13 545 94 635 79 87 180 121 389 130 l137 6 0 210 0 210 -91 -8 c-115 -9 -186 -27 -263 -68 -108 -57 -192 -157 -247 -292 -11 -27 -14 -12 -25 135 -7 91 -12 180 -13 198 l-1 32 -170 0 c-127 0 -172 -3 -175 -12z" />
            </g>

            {/* WILD RIFT - GOLD */}
            <g fill="none" stroke="#C89B3C">
              <path className="svg-elem-19" d="M6410 2163 c1 -10 110 -470 244 -1023 l243 -1005 300 -3 299 -2 163 757 c89 417 166 769 170 783 8 24 9 24 15 -10 4 -19 80 -370 170 -780 l162 -745 297 -3 296 -2 10 37 c12 43 465 1931 476 1981 l7 32 -195 0 -195 0 -11 -47 c-22 -94 -381 -1816 -381 -1826 0 -6 -2 -8 -5 -5 -3 2 -102 418 -220 924 -119 505 -218 927 -221 937 -5 15 -23 17 -199 17 l-194 0 -10 -37 c-6 -21 -105 -443 -221 -938 -116 -494 -213 -901 -215 -904 -3 -2 -5 0 -5 5 0 8 -335 1614 -380 1822 l-12 52 -194 0 c-178 0 -194 -1 -194 -17z" />
              <path className="svg-elem-20" d="M9440 880 l0 -750 185 0 185 0 0 750 0 750 -185 0 -185 0 0 -750z" />
              <path className="svg-elem-21" d="M9513 2199 c-113 -56 -119 -272 -10 -353 40 -29 196 -31 244 -2 71 43 98 191 54 291 -16 36 -29 50 -63 65 -60 27 -169 27 -225 -1z" />
              <path className="svg-elem-22" d="M10090 1155 l0 -1025 180 0 180 0 0 1025 0 1025 -180 0 -180 0 0 -1025z" />
              <path className="svg-elem-23" d="M11830 1738 l-1 -443 -29 57 c-117 225 -375 323 -665 251 -250 -62 -402 -289 -423 -636 -20 -329 41 -568 181 -711 71 -72 137 -109 245 -137 86 -22 239 -26 324 -8 126 26 257 119 329 233 l37 59 11 -39 c5 -21 20 -83 32 -136 l22 -98 159 0 158 0 0 1025 0 1025 -190 0 -190 0 0 -442z m-232 -464 c74 -21 161 -106 191 -186 34 -93 46 -220 32 -322 -17 -127 -45 -191 -111 -257 -75 -76 -129 -94 -275 -94 -93 0 -118 4 -160 23 -135 62 -205 205 -205 420 0 209 77 355 217 411 80 32 208 34 311 5z" />
              <path className="svg-elem-24" d="M13240 1155 l0 -1025 185 0 185 0 0 424 0 424 143 7 c161 8 340 -6 423 -32 72 -22 126 -70 153 -134 19 -44 24 -80 31 -235 5 -100 14 -202 20 -226 61 -223 275 -320 478 -217 l67 34 3 108 3 107 -70 -6 c-122 -12 -147 24 -180 253 -24 164 -49 240 -99 295 -38 43 -99 78 -132 78 -35 0 -13 17 32 24 146 24 274 160 324 346 22 82 25 291 5 370 -62 248 -263 383 -625 419 -60 6 -297 11 -528 11 l-418 0 0 -1025z m873 714 c225 -17 307 -53 355 -158 22 -48 26 -70 26 -151 1 -111 -14 -168 -54 -214 -68 -77 -177 -96 -567 -96 l-263 0 0 315 0 315 183 0 c100 0 244 -5 320 -11z" />
              <path className="svg-elem-25" d="M15160 880 l0 -750 183 2 182 3 0 745 0 745 -182 3 -183 2 0 -750z" />
              <path className="svg-elem-26" d="M15230 2198 c-88 -45 -118 -173 -65 -286 31 -67 78 -92 175 -92 136 0 194 60 195 200 0 56 -5 85 -20 114 -32 63 -62 79 -157 83 -72 4 -89 1 -128 -19z" />
              <path className="svg-elem-27" d="M16125 2226 c-65 -16 -105 -38 -146 -78 -66 -67 -89 -163 -89 -380 l0 -138 -100 0 -100 0 0 -135 0 -135 100 0 100 0 0 -615 0 -615 185 0 185 0 0 615 0 615 185 0 185 0 0 135 0 135 -185 0 -185 0 0 160 0 160 190 0 190 0 0 145 0 145 -232 -1 c-149 0 -251 -5 -283 -13z" />
              <path className="svg-elem-28" d="M17047 1908 c-12 -213 -62 -278 -214 -278 l-53 0 0 -135 0 -135 110 0 110 0 0 -412 c0 -227 5 -456 10 -508 17 -157 69 -234 190 -282 49 -19 80 -22 278 -26 l222 -4 0 146 0 146 -175 0 -175 0 0 470 0 470 170 0 170 0 0 135 0 135 -170 0 -170 0 0 190 0 190 -149 0 -148 0 -6 -102z" />
            </g>

            {/* FINAL DOT - BLUE */}
            <g fill="none" stroke="#32C8FF">
              <path className="svg-elem-29" d="M18000 548 c-63 -32 -95 -97 -95 -193 0 -145 68 -215 211 -215 83 0 118 10 157 48 52 50 72 176 42 263 -31 87 -84 119 -198 119 -56 0 -83 -5 -117 -22z" />
            </g>
          </g>
        </svg>
      </motion.div>

      {/* Background glow remains for premium feel */}
      {active && (
        <motion.div 
           animate={{ 
             opacity: [0.03, 0.08, 0.03],
             scale: [1, 1.1, 1]
           }}
           transition={{ 
             duration: 6, 
             repeat: Infinity,
             ease: "easeInOut" 
           }}
           className="absolute inset-0 bg-amber-500/10 blur-[50px] -z-10 rounded-full"
        />
      )}
    </div>
  );
};
