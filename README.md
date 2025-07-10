# aia-backend

Backend for AiA

## Utvikling

Bruk Node.js 20.

Du kan bruke [NVM](https://github.com/nvm-sh/nvm) for å sette versjon `nvm use`

- klon repo
- installer avhengigheter `npm i`
- start database: `docker-compose up -d database`
- sett miljøvariabler i `.env`: `cp .env-example .env`
- start utviklingsserver `npm start`
- åpne nettleseren på `http://localhost:3000`

## Docker oppsett

Kjør opp med [docker-compose](https://docs.docker.com/compose/)

For å starte: `docker-compose up -d`

For å stoppe: `docker-compose rm -f && docker-compose stop`

## Teste endepunkter lokalt

1. Logg inn på https://www.ansatt.dev.nav.no
2. Finn cookien `selvbetjening-idtoken`
3. Kopier verdien, og sett den inn i requesten under
4. Kjør `curl` i terminalen eller bruk en REST-klient:

```sh
curl -vvv 'http://localhost:3000/<endepunkt>' \
  -H $'Cookie: selvbetjening-idtoken=<TOKEN>'
```

## Database

[Prisma](https://www.prisma.io/docs/) blir benyttet for migrasjoner og ORM.

Database kjøres opp med:

```sh
docker-compose up -d database
```

Hvis du har gjort endringer i [prisma/schema.prisma](prisma/schema.prisma) kjør:

```sh
npx prisma migrate dev
```

For å legge inn seed-data:

```sh
npx prisma db seed
```

Sjekke hvordan databasen ser ut:

```sh
psql --username admin --dbname aia-backend --host localhost -W
```

## Deploye kun til dev

Ved å prefikse branch-navn med `dev/`, så vil branchen kun deployes i dev.

```
git checkout -b dev/<navn på branch>
```

evt. rename branch

```
git checkout <opprinnlig-branch>
git branch -m dev/<opprinnlig-branch>
```

## Dokumentasjon

Se swagger dokumentasjon på https://www.intern.dev.nav.no/aia-backend/docs/

# Henvendelser

Spørsmål knyttet til koden eller prosjektet kan stilles via issues her på github.

# For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen [#team-paw-dev](https://nav-it.slack.com/archives/CLTFAEW75)

# Lisens

[MIT](LICENSE)
