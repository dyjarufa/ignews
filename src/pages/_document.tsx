import Document, {Html, Head, Main, NextScript} from 'next/document'

export default class MyDocument extends Document {
  render() {
    return(
      <Html>
        <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap" rel="stylesheet" />
        <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
        </Head>
        <body>
          <Main /> {/* todo conteúdo da aplicação é renderizado aqui */}
          <NextScript /> {/* onde o nextjs vai colocar os scrips js para a aplicação funcionar */}
        </body>
      </Html>
    )
  }
}