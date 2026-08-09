import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @keyframes stb-fadein {
          from { opacity: 0; transform: translateX(-50%) translateY(18px) scale(0.85); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .scroll-top-btn {
          position: fixed;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 22px;
          background: #F0CC6A;
          color: #0C0B09;
          border: none;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 800;
          font-family: 'DM Sans', system-ui, sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(240,204,106,0.45), 0 2px 8px rgba(0,0,0,0.5);
          animation: stb-fadein 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .scroll-top-btn:hover {
          background: #f7d97a;
          transform: translateX(-50%) translateY(-2px);
          box-shadow: 0 8px 32px rgba(240,204,106,0.55), 0 2px 8px rgba(0,0,0,0.5);
        }
      `}</style>

      {visible && (
        <button type="button" className="scroll-top-btn" onClick={handleClick}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 11V2M2 6l4.5-4.5L11 6" stroke="#0C0B09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to top
        </button>
      )}
    </>
  );
}
