// @crxjs `?script` import returns the built content-script URL as a string.
declare module '*?script' {
  const src: string;
  export default src;
}
