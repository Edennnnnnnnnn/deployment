export async function getMessages(messageType) {
    const url = `/api/msgs/retrieve/${messageType}/`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        'Credentials': 'include',
    });

    if (response.ok) {
        const messages = await response.json();
        console.log(`Messages of type ${messageType}:`, messages);
        return messages;
    }
    else {
        console.error('Failed to get messages:', response.status, response.statusText);
    }
}


export async function createMessage(messageType, content, origin = "SYS") {
    const url = '/api/msgs/create/';
    const csrfToken = getCsrfToken();
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            message_type: messageType,
            origin: origin,
            content: content,
        }),
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Message created successfully:', data);
    }
    else {
        const error = await response.json();
        console.error('Failed to create message:', response.status, response.statusText, error);
    }
}


export async function createRemoteMessage(remoteMsgOpenAPI, messageType, content, origin = "SYS") {
    const csrfToken = getCsrfToken();
    const response = await fetch(remoteMsgOpenAPI, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            message_type: messageType,
            origin: origin,
            content: content,
        }),
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Message created successfully:', data);
    }
    else {
        const error = await response.json();
        console.error('Failed to create message:', response.status, response.statusText, error);
    }
}


export async function deleteMessageType(messageType) {
    const url = `/api/msgs/deleteType/${messageType}/`;
    const csrfToken = getCsrfToken();
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'include',
        });

        if (response.ok) {
            console.log('Message deleted successfully');
            return true;
        }
        else {
            console.error('Failed to delete message:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Error while deleting message:', error);
        return false;
    }
}


export async function deleteMessageID(messageID) {
    const url = `/api/msgs/deleteID/${messageID}/`;
    const csrfToken = getCsrfToken();
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'include',
        });
        if (response.ok) {
            console.log('Message deleted successfully');
            return true;
        }
        else {
            console.error('Failed to delete message:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Error while deleting message:', error);
        return false;
    }
}

export async function acceptFollowRequest(originUsername, msgId) {
    const url = `/api/follow-requests/accept/${originUsername}/`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            credentials: 'include', 
        });
        if (response.ok) {
            console.log('Follow request accepted successfully.');
            // delete the message
            deleteMessageID(msgId);
            return true;
        } else {
            console.error('Failed to accept follow request:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Error accepting follow request:', error);
        return false;
    }
}


export async function rejectFollowRequest(originUsername, msgId) {
    const url = `/api/follow-requests/reject/${originUsername}/`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(), 
            },
            credentials: 'include', 
        });
        if (response.ok) {
            console.log('Follow request rejected successfully.');
            // delete the message
            deleteMessageID(msgId);
            return true;
        } else {
            console.error('Failed to reject follow request:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Error rejecting follow request:', error);
        return false;
    }
}



function getCsrfToken() {
    const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

    if (!csrfToken) {
        console.error('CSRF token not found!');
        return '';
    }
    return csrfToken;
}



