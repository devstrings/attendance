const basicAuth = (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Seeder Area"');
    return res.status(401).json({
      success: false,
      message: "Basic authentication is required.",
    });
  }

  const encoded = header.slice(6).trim();
  let decoded = "";

  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid basic auth header.",
    });
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) {
    return res.status(401).json({
      success: false,
      message: "Invalid basic auth credentials format.",
    });
  }

  const providedUsername = decoded.slice(0, separatorIndex);
  const providedPassword = decoded.slice(separatorIndex + 1);

  const expectedUsername = process.env.BASIC_AUTH_USERNAME || "";
  const expectedPassword =
    process.env.BASIC_AUTH_PASSWOR || process.env.BASIC_AUTH_PASSWORD || "";

  if (!expectedUsername || !expectedPassword) {
    return res.status(500).json({
      success: false,
      message:
        "Seeder basic auth environment variables are not configured on server.",
    });
  }

  if (
    providedUsername !== expectedUsername ||
    providedPassword !== expectedPassword
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid basic auth credentials.",
    });
  }

  return next();
};

module.exports = { basicAuth };
