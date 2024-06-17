addEventListener("fetch", (event) => {
  event.passThroughOnException();
  event.respondWith(handleRequest(event.request));
});

const routes = {
  "docker.tycng.com": "https://registry-1.docker.io",
  "quay.tycng.com": "https://quay.io",
  "gcr.tycng.com": "https://gcr.io",
  "k8s-gcr.tycng.com": "https://k8s.gcr.io",
  "k8s.tycng.com": "https://registry.k8s.io",
  "ghcr.tycng.com": "https://ghcr.io",
  "cloudsmith.tycng.com": "https://docker.cloudsmith.io",
};

function routeByHosts(host) {
  if (host in routes) {
    return routes[host];
  }
  if (MODE == "debug") {
    return TARGET_UPSTREAM;
  }
  return "";
}

async function handleRequest(request) {
  let url = new URL(request.url);
  const upstream = routeByHosts(url.hostname);
  if (upstream === "") {
    return new Response(
      JSON.stringify({
        routes: routes,
      }),
      {
        status: 404,
      }
    );
  }
  if (upstream === "https://registry-1.docker.io") {
    // Modify URL if necessary based on search parameters and encoded characters
    if (!/%2F/.test(url.search) && /%3A/.test(url.toString())) {
      let modifiedUrl = url.toString().replace(/%3A(?=.*?&)/, '%3Alibrary%2F');
      url = new URL(modifiedUrl);
    }

    // Append 'library' to the pathname if necessary
    const libraryPathPattern = /^\/v2\/[^/]+\/[^/]+\/[^/]+$/;
    const libraryPrefixPattern = /^\/v2\/library/;
    if (libraryPathPattern.test(url.pathname) && !libraryPrefixPattern.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/v2\//, '/v2/library/');
    }
  }
  // check if need to authenticate
  if (url.pathname == "/v2/") {
    const newUrl = new URL(upstream + "/v2/");
    const resp = await fetch(newUrl.toString(), {
      method: "GET",
      redirect: "follow",
    });
    if (resp.status === 200) {
    } else if (resp.status === 401) {
      const headers = new Headers();
      if (MODE == "debug") {
        headers.set(
          "Www-Authenticate",
          `Bearer realm="${LOCAL_ADDRESS}/v2/auth",service="cloudflare-docker-proxy"`
        );
      } else {
        headers.set(
          "Www-Authenticate",
          `Bearer realm="https://${url.hostname}/v2/auth",service="cloudflare-docker-proxy"`
        );
      }
      return new Response(JSON.stringify({ message: "UNAUTHORIZED" }), {
        status: 401,
        headers: headers,
      });
    } else {
      return resp;
    }
  }
  // get token
  if (url.pathname == "/v2/auth") {
    const newUrl = new URL(upstream + "/v2/");
    const resp = await fetch(newUrl.toString(), {
      method: "GET",
      redirect: "follow",
    });
    if (resp.status !== 401) {
      return resp;
    }
    const authenticateStr = resp.headers.get("WWW-Authenticate");
    if (authenticateStr === null) {
      return resp;
    }
    const wwwAuthenticate = parseAuthenticate(authenticateStr);
    return await fetchToken(wwwAuthenticate, url.searchParams);
  }
  // foward requests
  const newUrl = new URL(upstream + url.pathname);
  const newReq = new Request(newUrl, {
    method: request.method,
    headers: request.headers,
    redirect: "follow",
  });
  return await fetch(newReq);
}

function parseAuthenticate(authenticateStr) {
  // sample: Bearer realm="https://auth.ipv6.docker.com/token",service="registry.docker.io"
  // match strings after =" and before "
  const re = /(?<=\=")(?:\\.|[^"\\])*(?=")/g;
  const matches = authenticateStr.match(re);
  if (matches === null || matches.length < 2) {
    throw new Error(`invalid Www-Authenticate Header: ${authenticateStr}`);
  }
  return {
    realm: matches[0],
    service: matches[1],
  };
}

async function fetchToken(wwwAuthenticate, searchParams) {
  const url = new URL(wwwAuthenticate.realm);
  if (wwwAuthenticate.service.length) {
    url.searchParams.set("service", wwwAuthenticate.service);
  }
  if (searchParams.get("scope")) {
    url.searchParams.set("scope", searchParams.get("scope"));
  }
  return await fetch(url, { method: "GET", headers: {} });
}
