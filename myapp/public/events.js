// Établir la connexion SSE
window.onload = function() {
    const evtSource = new EventSource('/api/events');
    const messageContainer = document.getElementById('messageContainer');

    evtSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Nouvel événement SSE:', data);
        message = "";
        if (typeof data === 'string') {
            console.log('data is a string');
            message = `Message: ${data}, Timestamp: ${new Date().toISOString()}`
        }
        else{
            message = `Message: ${data.message}, Timestamp: ${data.timestamp}`;
        }

        // Afficher le contenu de l'événement dans le conteneur
        const messageElement = document.createElement('div');
        messageElement.innerHTML = message;
        messageContainer.appendChild(messageElement);
    };

    evtSource.onerror = function(err) {
        console.error('Erreur SSE:', err);
        // Vous pouvez gérer les erreurs ici
    };
};