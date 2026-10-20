import {createHandlers} from '../_studio/core.mjs';
export const config = {runtime:'edge'};
export default function handler(req){return createHandlers({env:process.env}).post(req);}
