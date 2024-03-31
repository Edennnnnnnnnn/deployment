'use strict';

import {formatDate} from "./common.js";
document.addEventListener('DOMContentLoaded', async () => {
    const username = _getURLUsername()


    fetch(`/api/fps/${username}/`)
        .then(response => response.json())
        .then(posts => {
            console.log('Friends List:', posts);
            const postContainer = document.getElementById('post-container');
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';

                const postLink = document.createElement('a');
                postLink.href = `/posts/${post.id}`;
                postLink.className = 'post-link';

                const datePosted = new Date(post.date_posted);
                // const formattedDate = `${datePosted.getFullYear()}-${datePosted.getMonth() + 1}-${datePosted.getDate()}`;
                const formattedDate = formatDate(datePosted)
                const userInfoHTML = `
                    <div class="user-info">
                        <img src="${post.avatar}" alt="profile avatar" class="user-avatar">
                        <div class="username">${post.username || 'Unknown User'}</div>
                        <div class="post-time">${formattedDate}</div>
                        <div class="corner-icon">
                            ${post.content_type === 'COMMONMARK' ? '<ion-icon name="logo-markdown" style="padding: 10px;"></ion-icon>' : ''}
                            ${post.visibility === 'FRIENDS' ? '<ion-icon name="people" style="padding: 10px;"></ion-icon>' : ''}
                        </div>
                    </div>
                `;

                const contentHTML = `
                    <div class="content">
                        <div class="title">${post.title}</div>
                        <p class="post-content">${post.content}</p>
                        ${createImagesHTML(post.image_data)}
                    </div>
                `;

                const interactionHTML = `
                    <div class="interact-container">
                        <button id="comment-${post.id}" type="button" data-post-id="${post.id}">
                            <ion-icon size="small" name="chatbox-ellipses-outline" style="margin-right: 8px;">
                            </ion-icon>
                                ${post.comment_count > 0 ? '' : 'Comment'} 
                                <span class="comment-count">${post.comment_count > 0 ? post.comment_count : ''}
                            </span>
                        </button>
                        <button id="like-${post.id}" type="button" data-post-id="${post.id}"> 
                            <ion-icon size="small" name="heart-outline" style="margin-right: 8px;">
                            </ion-icon>
                                    ${post.likes_count > 0 ? '' : 'Like'}
                                <span class="like-count">${post.likes_count > 0 ? post.likes_count : ''}</span>
                        </button>
                    </div>
                `;

                // Append userInfoHTML, contentHTML, and interactionHTML to postLink instead of postElement
                postLink.innerHTML = userInfoHTML + contentHTML + interactionHTML;
                postElement.appendChild(postLink);
                // postElement.innerHTML += interactionHTML;
                postContainer.appendChild(postElement);


            });
            sortPostsByDate();
        })
        .catch(error => console.error('Error:', error));
});

export function createRemotePostBlocks_0_enjoy(remotePosts) {
    console.log("@ remotePosts: ", remotePosts);
    const postContainer = document.getElementById('post-container');
    remotePosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';

        const postLink = document.createElement('a');
        postLink.href = `/remoteprofile/enjoy/${post.author.displayName}/`;
        postLink.className = 'post-link';

        const datePosted = new Date(post.published);
        const formattedDate = formatDate(datePosted);

        const userInfoHTML = `
            <div class="user-info">
                <img src="${post.avatar}" alt="profile avatar" class="user-avatar">
                <div class="username">${post.author.displayName || 'Unknown User'}</div>
                <div class="post-time">${formattedDate}</div>
                <div class="corner-icon">
                    ${post.content_type === 'COMMONMARK' ? '<ion-icon name="logo-markdown"></ion-icon>' : ''}
                    <ion-icon name="earth"></ion-icon>
                </div>
            </div>
        `;

        const contentHTML = `
            <div class="content">
                <div class="title">${post.title}</div>
                ${isImageData(post.content) ? createImagesHTML(post.content) : `<p class="remote-post-content">${post.content}</p>`}
                
            </div>
        `;

        const interactionHTML = `
            <div class="interact-container">
                <!-- <button id="share-${post.id}" type="button" data-post-id="${post.id}">
                    <ion-icon size="small" name="share-outline" style="margin-right: 8px;"></ion-icon>
                    Share <span class="share-count">${post.share_count}</span>
                </button> -->
                <button id="comment-${post.id}" type="button" data-post-id="${post.id}">
                    <ion-icon size="small" name="chatbox-ellipses-outline" style="margin-right: 8px;">
                    </ion-icon>
                        ${post.comment_count > 0 ? '' : 'Comment'} 
                        <span class="comment-count">${post.comment_count > 0 ? post.comment_count : ''}
                    </span>
                </button>
                <button id="like-${post.id}" type="button" data-post-id="${post.id}"> 
                    <ion-icon size="small" name="heart-outline" style="margin-right: 8px;">
                    </ion-icon>
                            ${post.likes_count > 0 ? '' : 'Like'}
                        <span class="like-count">${post.likes_count > 0 ? post.likes_count : ''}</span>
                </button>
            </div>
        `;

            postLink.innerHTML = userInfoHTML + contentHTML;
            postElement.appendChild(postLink);
            postElement.innerHTML += interactionHTML;
            postContainer.appendChild(postElement);
    });
    sortPostsByDate();
}


window.addEventListener('pageshow', function(event) {
    if (sessionStorage.getItem('refreshOnBack') === 'true') {
        sessionStorage.removeItem('refreshOnBack');
        window.location.reload();
    }
});

function _getURLUsername() {
    const pathSections = window.location.pathname.split('/');
    return pathSections[2];
}

function isImageData(content) {
    // Check if the content starts with 'data:image'
    return content.trim().startsWith('data:image');
}

function createImagesHTML(imageDataString) {
    if (!imageDataString) return '';

    const imageDataArray = imageDataString.split(",");
    let imagesHTML = '';

    for (let i = 1; i < imageDataArray.length; i += 2) {
        let base64Data = imageDataArray[i];
        if (base64Data.trim()) {
            imagesHTML += `<img src="data:image/jpeg;base64,${base64Data}" class="post-image" style="width: 30%; max-height: 500px; margin: 0 10px">`;
        }
    }
    return imagesHTML;
}

function sortPostsByDate() {
    const postContainer = document.getElementById('post-container');
    const posts = postContainer.querySelectorAll('.post');

    // 将帖子元素转换为数组，并根据日期排序
    const sortedPosts = Array.from(posts).sort((a, b) => {
        const dateA = new Date(a.querySelector('.post-time').innerText);
        const dateB = new Date(b.querySelector('.post-time').innerText);
        return dateB - dateA; // 降序排序
    });

    // 清空原有的帖子容器
    postContainer.innerHTML = '';

    // 将排序后的帖子重新追加到帖子容器中
    sortedPosts.forEach(post => {
        postContainer.appendChild(post);
    });
}


