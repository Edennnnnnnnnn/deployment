'use strict';


document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('search-form');
    const filterValue = document.getElementById('filter');
    var serverNode;


    document.getElementById('filter-form').addEventListener('submit', async function(event) {
        alert("Target Node Changed Successfully")
        event.preventDefault();
        serverNode = filterValue.value;
        console.log(serverNode);

        if (!searchForm) {
            console.error('Search form not found');
            return;
        }

        searchForm.addEventListener('submit', async function(event) {
            event.preventDefault();


            const currentUserInput = searchForm.querySelector('input[name="user1_id"]');
            const searchQueryInput = searchForm.querySelector('input[name="user2_id"]');

            if (!currentUserInput || !searchQueryInput) {
                console.error('Input fields not found');
                return;
            }


            const currentUser = currentUserInput.value;
            const searchQuery = searchQueryInput.value;
            console.log("current: ", currentUser, "searching --> ", searchQuery, "from", serverNode,);


            try {
                const response = await fetch(`/openapi/search/${serverNode}/${searchQuery}/`);
                if (!response.ok) {
                    alert("Remote user not found...")
                    throw new Error('Failed to search users on the selected server');
                }
                const data = await response.json();
                console.log(data);
                fetch(`/openapi/profile/${currentUser}/${serverNode}/${searchQuery}/`)
                    .then(response => {
                        if (!response.ok) {
                            alert("User not found");
                        }
                        window.location.href = `/openapi/profile/${currentUser}/${serverNode}/${searchQuery}/`;
                    })
            } catch (error) {
                console.error('Error searching users:', error);
            }

        });
    });


});


