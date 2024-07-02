import type {
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";


import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,

} from "@remix-run/react";

import "./tailwind.css";

import appStylesHref from "./app.css?url";


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];



export default function App() {
  

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet/>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
