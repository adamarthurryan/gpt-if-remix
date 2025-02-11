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

import appStylesHref from "./app.css?url";
import tailwindStylesheet from "~/tailwind.css?url";


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
  { rel: "stylesheet", href: tailwindStylesheet },

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
        <div className="container mx-auto">
          <Outlet/>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
