declare module 'pdfmake/build/pdfmake' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake: any;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: {
    pdfMake: {
      vfs: Record<string, string>;
    };
  };
  export default pdfFonts;
}
