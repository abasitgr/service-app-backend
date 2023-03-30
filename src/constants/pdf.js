module.exports = Object.freeze({
    // Fonts for PDF Make. Provided by fonts-roboto in the docker image
    // https://pdfmake.github.io/docs/getting-started/server-side/
    FONTS: {
        // Roboto: {
        //     normal: '/usr/share/fonts/truetype/roboto/hinted/Roboto-Regular.ttf',
        //     bold: '/usr/share/fonts/truetype/roboto/hinted/Roboto-Medium.ttf',
        //     italics: '/usr/share/fonts/truetype/roboto/hinted/Roboto-Italic.ttf',
        //     bolditalics: '/usr/share/fonts/truetype/roboto/hinted/Roboto-MediumItalic.ttf'
        // },
        Roboto: {
            normal: 'Courier',
            bold: 'Courier-Bold',
            italics: 'Courier-Oblique',
            bolditalics: 'Courier-BoldOblique'
        }
    },
    COLORS: {
        CPP_RED: '#BF272F',
        CPP_SAND: '#D7D4CD',
        FONT_COLOR: '#333333',
    },
    // https://pdfmake.github.io/docs/document-definition-object/page/
    SIZE: {
        EXECUTIVE: 'EXECUTIVE',
        FOLIO: 'FOLIO',
        LEGAL: 'LEGAL',
        LETTER: 'LETTER',
        TABLOID: 'TABLOID',
    }
});