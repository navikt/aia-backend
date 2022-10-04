import axios, {AxiosError} from 'axios';
import {Request, Response, Router} from 'express';
import {CONSUMER_ID_HEADER_NAME, CONSUMER_ID_HEADER_VALUE, NAV_COOKIE_NAME} from '../config';


function ptoProxyCall(url: string) {
  return async (req: Request, res: Response) => {
    const token = req.cookies[NAV_COOKIE_NAME];
    try {
      const { data } = await axios(url, {
        method: req.method,
        data: req.method === 'POST' ? req.body : undefined,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          Authorization: `Bearer ${token}`,
          [CONSUMER_ID_HEADER_NAME]: CONSUMER_ID_HEADER_VALUE,
        },
        responseType: 'stream',
      });
      data.pipe(res);
    } catch (err) {
      console.error(err);
      const status = (err as AxiosError).response?.status || 500;
      res.status(status).send((err as Error).message);
    }
  }
}

function arbeidsSokerPerioder(url: string) {
  return async (req: Request, res: Response) => {
    const token = req.cookies[NAV_COOKIE_NAME];
    try {
      const { data } = await axios(url, {
        method: 'POST',
        params: req.query,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          Authorization: `Bearer ${token}`,
          [CONSUMER_ID_HEADER_NAME]: CONSUMER_ID_HEADER_VALUE,
        },
        responseType: 'stream',
      });
      data.pipe(res);
    } catch (err) {
      console.error(err);
      const status = (err as AxiosError).response?.status || 500;
      res.status(status).send((err as Error).message);
    }
  }
}

function ptoProxy() {
  const router = Router();
  router.get('/oppfolging', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarboppfolging/api/oppfolging`));
  router.get('/underoppfolging', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarboppfolging/api/niva3/underoppfolging`));
  router.get('/startregistrering', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarbregistrering/api/startregistrering`));
  router.get('/registrering', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarbregistrering/api/registrering`));
  router.get('/standard-innsats', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarbregistrering/api/profilering/standard-innsats`));
  router.get('/dialog/antallUleste', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarbdialog/api/dialog/antallUleste`));
  router.get('/vedtakinfo/besvarelse', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarbvedtakinfo/api/behovsvurdering/besvarelse`));
  router.get('/vedtakinfo/motestotte', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarbvedtakinfo/api/motestotte`));
  router.get('/arbeidssoker/perioder', arbeidsSokerPerioder(`${process.env.PTO_PROXY_URL}/veilarbregistrering/api/arbeidssoker/perioder`));
  router.get('/gjelderfra', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarbregistrering/api/registrering/gjelderfra`));
  router.post('/gjelderfra', ptoProxyCall(`${process.env.PTO_PROXY_URL}/veilarbregistrering/api/registrering/gjelderfra`));

  return router;
}

export default ptoProxy;
