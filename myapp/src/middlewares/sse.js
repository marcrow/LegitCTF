// sse.js
let connections = [];

const sseMiddleware = function (req, res, next) {
  if (req.path == '/events') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add this connection to the list
    connections.push(res);

    // Clean up when the connection is closed
    const cleanup = () => {
      connections = connections.filter(conn => conn !== res);
    };

    res.on('finish', cleanup);
    res.on('error', cleanup);
    res.on('close', cleanup);
  }

  // Add the connections to the request object
  req.connections = connections;

  next();
};

module.exports = sseMiddleware;