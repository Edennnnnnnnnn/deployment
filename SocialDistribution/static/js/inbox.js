'use strict';

import {
    getMessages,
    createMessage,
    deleteMessageType,
    deleteMessageID,
    acceptFollowRequest,
    rejectFollowRequest,
} from './messageOperations.js';

function clickableListItem(messages) {
    messages.forEach(function(message) {
        message.querySelector('.message-header').addEventListener('click', function() {
            message.classList.toggle('unfolded');
        });
    });
}

function clickableFilterMessages() {
    let filterForm = document.getElementById('filter-form');
    filterForm.addEventListener('submit', function(event) {
        event.preventDefault();
        let type = document.getElementById('filter').value;
        filterAndDisplayMessages(type);
    });
}

function filterAndDisplayMessages(filter) {
    let messageContainer = document.querySelector('.inbox-container');
    let messages = messageContainer.querySelectorAll('.message');
    messages.forEach(function(message) {
        let subjectType = message.getAttribute('type');
        if (filter === 'all' || filter === subjectType) {
            message.style.display = '';
        }
        else {
            message.style.display = 'none';
        }
    });
}


function createBlock(msg, type, isNewMsg = true) {
    let li_message = document.createElement("li");
    li_message.classList.add("message");
    if (isNewMsg) {
        li_message.classList.add("unread");
    }

    let span_statusDot = document.createElement("span");
    span_statusDot.classList.add("status-dot");
    if (isNewMsg) {
        span_statusDot.classList.add("unread-indicator");
    }

    let img_avatar = document.createElement("img");
    img_avatar.classList.add("user-avatar");
    img_avatar.src = staticUrl + 'images/' + (msg.origin_avatar || 'default_avatar.png');

    let span_sender = document.createElement("span");
    span_sender.classList.add("sender");
    span_sender.textContent = msg.origin;

    let div_messageHeader = document.createElement("div");
    div_messageHeader.classList.add("message-header");
    div_messageHeader.appendChild(span_statusDot);
    div_messageHeader.appendChild(img_avatar);
    div_messageHeader.appendChild(span_sender);

    let span_date = document.createElement("span");
    span_date.classList.add("message-date");
    let messageDate = new Date(msg.date);
    span_date.textContent = messageDate.toLocaleString();
    div_messageHeader.appendChild(span_date);

    let TYPES = {
        'FR': 'Follow Request',
        'LK': 'Like',
        'CM': 'Comment',
        'NP': 'New Post Reminder',
        'SU': 'New Sign Up'
    };

    let span_actionType = document.createElement("span");
    span_actionType.classList.add("action-type");
    span_actionType.textContent = `[${TYPES[type]}] `;
    div_messageHeader.appendChild(span_actionType); 

    // Create a div for message body that can be shown/hidden
    let div_messageBody = document.createElement("div");
    div_messageBody.classList.add("message-body");
    let p_content = document.createElement("p");
    p_content.textContent = msg.content;
    p_content.classList.add("message-text");
    div_messageBody.appendChild(p_content);

    if (type === 'FR') {
        // add accept and reject Button
        const acceptButton = document.createElement("button");
        acceptButton.textContent = "Accept";
        // add click listener
        acceptButton.addEventListener('click', function() {
            event.stopPropagation();
            // accepct
            acceptFollowRequest(msg.origin, msg.id);
            alert("Request Accepted!!");
            window.location.reload();
        });
    
        const rejectButton = document.createElement("button");
        rejectButton.textContent = "Reject";
        // reject
        rejectButton.addEventListener('click', function() {
            event.stopPropagation();    
            rejectFollowRequest(msg.origin, msg.id);
            alert("Request Rejected!!");
            window.location.reload();
        });
    
        // add button to message body
        div_messageBody.appendChild(acceptButton);
        div_messageBody.appendChild(rejectButton);
    }

    let a_postLink = document.createElement("a");
    a_postLink.href = `/posts/${msg.post_id}/`;
    a_postLink.classList.add("view-post-link");
    a_postLink.textContent = "View Post";
    // Place the View Post link outside the message body to always show it
    div_messageBody.appendChild(a_postLink);

    let button_delete = document.createElement("button");
    button_delete.classList.add("inbox-delete-btn");
    button_delete.textContent = "Delete";
    button_delete.setAttribute('ID', msg.id);
    div_messageBody.appendChild(button_delete);

    let button_star = document.createElement("button");
    button_star.classList.add("inbox-star-btn");
    button_star.textContent = "Star";
    div_messageBody.appendChild(button_star);

    li_message.appendChild(div_messageHeader);
    // Initially hide the message body
    div_messageBody.style.display = "none";
    li_message.appendChild(div_messageBody);

    li_message.setAttribute('type', type);

    // Toggle the display of the message body on click
    div_messageHeader.addEventListener('click', function() {
        // Check the current display state and toggle it
        if (div_messageBody.style.display === "none") {
            div_messageBody.style.display = "block";
            span_statusDot.style.display = "none"; // Optionally hide the unread indicator
        } else {
            div_messageBody.style.display = "none";
            if (isNewMsg) {
                span_statusDot.style.display = "block";
            }
        }
    });

    return li_message;
}

async function loadAndDisplayMessages() {
    let messageTypes = ['FR', 'LK', 'CM', 'NP', 'SU']; // Array of message types
    let ul_inboxMsgContainer = document.getElementById('msgContainer');
    ul_inboxMsgContainer.innerHTML = '';

    for (let type of messageTypes) {
        try {
            let messages = await getMessages(type);
            if (messages && Array.isArray(messages)) {
                // sort by time
                messages.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

                for (let msg of messages) {
                    let li_message = createBlock(msg, type);
                    ul_inboxMsgContainer.appendChild(li_message);
                }
            }
            else {
                console.error(`Messages of type [${type}] are not an array.`);
            }
        } catch (error) {
            console.error(`An error occurred while fetching messages of type ${type}:`, error);
        }
    }
}

function deleteMessage() {
    const deleteButtons = document.getElementsByClassName('inbox-delete-btn');

    for (let button of deleteButtons) {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            let messageID = event.target.getAttribute("ID");
            let isDeleted = deleteMessageID(parseInt(messageID));
            if (isDeleted) {
                alert("Message Deleted")
                location.reload();
            }
            else {
                alert("Fail to Delete Message")
            }
        })
    }

    let filterForm = document.getElementById('filter-form');
    filterForm.addEventListener('reset', function(event) {
        event.preventDefault();
        let type = document.getElementById('filter').value;
        if (type === 'all') {
            alert("Warning: You Are Deleting All Messages!! (Re-click To Confirm)")
            filterForm.addEventListener('reset', function(event) {
                event.preventDefault();
                for (let type of ['FR', 'LK', 'CM', 'NP', 'SU']) {
                    deleteMessageType(type);
                }
                alert(`All Messages Are Deleted`);
                location.reload();
            });
        }
        else {
            let isDeleted = deleteMessageType(type);
            if (isDeleted) {
                alert(`All In-type Messages Are Deleted`);
                location.reload();
            }
            else {
                alert("Fail to Delete Message");
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async function() {
   /*
    await createMessage("SU", "SU", "Eden1");
    await createMessage("CM", "CM", "Eden2");
    await createMessage("LK", "LK", "Eden3");
    await createMessage("FR", "FR", "Eden4");
*/
    await loadAndDisplayMessages();
    clickableFilterMessages();
    clickableListItem(document.querySelectorAll('.inbox-messages .message'));
    deleteMessage()
});
