// Small notification that fades in at the bottom of the screen.
// Parent owns the message state; pass `show` to control visibility.
// Rendered always (not conditionally) so the fade-out transition can play.
function Toast({ show, message }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#13293E] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 pointer-events-none ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {message}
    </div>
  )
}

export default Toast
