const express = require("express");
const NodeCache = require("node-cache");
const { v4: uuidv4 } = require("uuid");
const { Buffer } = require("buffer");
const tokenxAuthHandler = require("./security/tokenxAuthHandler");

const soknadCache = new NodeCache();

const HOST = process.env.POC_HOST;

const app = express();

app.use(express.json({ limit: "50mb" }));
app.set('views', './views');
app.set('view engine', 'pug');

app.get("/internal/isAlive|isReady", (req, res) => res.sendStatus(200));

app.get('/', (req, res) => {
   res.render('index');
});

app.get('/soknad/:id', (req, res) => {
   const soknadUuid = req.params.id;
   const soknad = soknadCache.get(soknadUuid);
   console.log("Cache hit:", soknadUuid, !!soknad);
   const soknadDetails = {
      id: soknadUuid,
      soknad: {
         ...soknad,
         pdfUrl: `${HOST}/fyllUt/pdf/${soknadUuid}`
      },
   }
   res.render('soknad', soknadDetails);
});

app.post("/fyllUt/leggTilVedlegg", tokenxAuthHandler, function (req, res) {
   const soknad = req.body;
   if (req.getIdportenPid) {
      const idportenPid = req.getIdportenPid();
      console.log("Brukerid i søknad matcher idporten pid", idportenPid === soknad.brukerId)
   }

   if (soknad.tema === "ERR") { // <-- hardkoding for å lett kunne teste feilhåndtering i FyllUt
      const errorBody = {
         "arsak": "JSON parse error: Cannot deserialize value of type `byte[]` from String \"string\": not a valid `byte` value; nested exception is com.fasterxml.jackson.databind.exc.InvalidFormatException: Cannot deserialize value of type `byte[]` from String \"string\": not a valid `byte` value\n at [Source: (PushbackInputStream); line: 13, column: 7] (through reference chain: no.nav.soknad.innsending.dto.SkjemaDto[\"hoveddokument\"]->no.nav.soknad.innsending.dto.SkjemaDokumentDto[\"document\"]->byte[][0])",
         "message": "Noe gikk galt, prøv igjen senere"
      };
      res.setHeader("Content-Type", "application/json");
      res.status(405).send(JSON.stringify(errorBody));
   } else {
      const uuid = uuidv4();
      soknadCache.set(uuid, soknad);
      const location = `${HOST}/soknad/${uuid}`;
      console.log("Ny soknad location:", location);
      res.redirect(location);
   }
});

app.get("/fyllUt/pdf/:id", function (req, res) {
   const soknadUuid = req.params.id;
   const soknad = soknadCache.get(soknadUuid);
   res.type('application/pdf');
   res.header('Content-Disposition', `attachment; filename="${soknadUuid}.pdf"`);
   const pdfContent = soknad.hoveddokument.document[0].replace("data:application/pdf;base64,", "");
   res.send(Buffer.from(pdfContent, "base64"));
});

const port = parseInt(process.env.PORT || "9000");
console.log(`serving on ${port}`);
app.listen(port);
