document.addEventListener('DOMContentLoaded', function() {
    const selectElement = document.getElementById('filter');

    function fetchServerNodes() {
        fetch('/api/servernodes/')
            .then(response => response.json())
            .then(data => {
                data.forEach(serverNode => {
                    const option = document.createElement('option');
                    option.value = serverNode.name;
                    option.textContent = serverNode.name;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching ServerNodes:', error));
    }

    fetchServerNodes();

    let form = document.querySelector('.ac-container form');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        let targetHost = document.querySelector('[name="targetHost"]').value;
        let targetOpenapi = document.querySelector('[name="targetOpenapi"]').value;
        let username = document.querySelector('[name="username"]').value;
        let password = document.querySelector('[name="password"]').value;
        let localName = document.querySelector('[name="localName"]').value;

        let formData = {
            username: username,
            password: password,
            from: localName,
            get_for_our_connection: window.location.origin + "/openapi/"
        };

        fetch(targetOpenapi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                    if (response.ok) {
                        fetch(targetOpenapi, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCSRFToken()
                            },
                        }).then(response => response.json()) // Parse the JSON from the response
                            .then(jsonResponse => {
                                    if (response.ok) {
                                        alert("New node connect.");
                                        let urls = jsonResponse.our_openapi_url;
                                        console.log("?? ", urls)

                                        let our_host_name = urls.our_host_name;
                                        let to_add_a_connection_with_us = urls.to_add_a_connection_with_us;
                                        let to_search_a_spec_user = urls.to_search_a_spec_user;
                                        let to_info_a_spec_user = urls.to_info_a_spec_user;
                                        let to_get_our_user_list = urls.to_get_our_user_list;

                                        console.log("* ", targetHost + "api/users/")
                                        fetch(targetHost + "api/users/", {
                                            method: 'GET',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRFToken': getCSRFToken()
                                            }
                                        }).then(response => response.json())
                                            .then(remoteUserList => {
                                                console.log("remote User List:", remoteUserList)
                                                for (let remoteUser of remoteUserList) {

                                                    let userData = {
                                                        username: remoteUser.username,
                                                        email: remoteUser.email,
                                                        bio: remoteUser.bio,
                                                        server_node_name: our_host_name,
                                                        remoteOpenapi: targetOpenapi.toString(),
                                                        remoteInboxAPI: (_removeLastPartOfUrl(to_info_a_spec_user) + remoteUser.username + "/").toString(),
                                                        remoteFollowAPI: (targetHost + `api/user/${remoteUser.username}/posts/`).toString()
                                                    };
                                                    console.log("userData:", userData);


                                                    let userSearchPage = targetHost + "search/?q=" + remoteUser.name;
                                                    let createUserURL = targetHost + "api/createLocalProjUser/";
                                                    console.log("FETCH createUserURL-->" + createUserURL);
                                                    fetch(createUserURL, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'X-CSRFToken': getCSRFToken()
                                                        },
                                                        body: JSON.stringify(userData)
                                                    })
                                                        .then(response => {
                                                            if (!response.ok) {
                                                                throw new Error('Network response was not ok: ' + response.statusText);
                                                            }
                                                            else {
                                                                alert("All remote user projections create on local server.");
                                                            }
                                                            return response;
                                                        })
                                                        .then(data => {
                                                            console.log('User created:', data);
                                                        })
                                                        .catch(error => {
                                                            console.error('There has been a problem with your fetch operation:', error);
                                                        });
                                                }
                                            });
                                        return response;
                                    }
                                }
                            )
                        return response;
                    }
                    else {
                        alert("Failed to connect new node.");
                        throw new Error('Network response was not ok.');
                    }
                }
            )
            .then(data => {
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    });
});


function getCSRFToken() {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken' + '=')) {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function _removeLastPartOfUrl(url) {
    return url.replace(/\/[^\/]*\/?$/, '/');
}

function _removeQueryParam(url, paramName) {
    const urlObj = new URL(url);
    urlObj.searchParams.delete(paramName);
    return urlObj.toString();
}

/*
console.log(userSearchPage);
fetch(userSearchPage, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
    },
}).then(r => {
        if (response.ok) {
            const profileResponse = response.json();
            remoteUserInfo.remoteFollowAPI = profileResponse.url
        }
    },
)*/

