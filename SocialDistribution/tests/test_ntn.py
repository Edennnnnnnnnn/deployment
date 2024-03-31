#!/usr/bin/env python
# -*- coding:utf-8 -*-
import base64
import json
from unittest.mock import patch, MagicMock

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from SocialDistribution.models import User, Host, Post, ProjUser


class NodeToNodeAPITests(APITestCase):
    def setUp(self):
        # Create two test users
        self.user1 = User.objects.create_user(username='user1', password='password1', is_approved=True)
        self.client.login(username='user1', password='password1')
        self.host = Host.objects.create(name="SELF", username='test', password='test', host='')

    def _headers(self):
        auth = f"{self.host.username}:{self.host.password}".encode('utf-8')
        return {
            'Authorization': f'basic {base64.b64encode(auth).decode()}'
        }

    def test_get_users(self):
        url = reverse('OPEN_GETUsersList')
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_user_posts(self):
        url = reverse('OPEN_GETUserPostsList', kwargs={'username': self.user1.username})
        Post.objects.create(
            author=self.user1,
            title='Test Post',
            content='Test Content',
        )
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['posts']), 1)
        self.assertTrue(response.data['user'])

    def test_get_remote_user_profile(self):
        pro_user = ProjUser.objects.create(
            host='localhost',
            hostname='localhost',
            username='test',
        )

        kwargs = {
            'server_node_name': pro_user.hostname,
            'remoteUsername': pro_user.username
        }
        url = reverse('PAGE_RemoteProfile', kwargs=kwargs)
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, "Profile (Remote)")

    class MockResponse:
        @classmethod
        def raise_for_status(cls):
            pass

        @classmethod
        def json(cls):
            return {}

    @patch('SocialDistribution.views.requests.post', MagicMock(return_value=MockResponse()))
    def test_follow_requesting(self):
        # Test enjoy
        host = Host.objects.create(
            name="enjoy",
            username='test',
            password='test',
            host=''
        )
        pro_user = ProjUser.objects.create(
            host='localhost',
            hostname=host.name,
            username='test',
            remoteInbox='',
        )

        kwargs = {
            'remoteNodename': host.name,
            'requester_username': self.user1.username,
            'proj_username': pro_user.username
        }
        url = reverse('API_PostRequesting', kwargs=kwargs)
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test 200OK
        host = Host.objects.create(
            name="200OK",
            username='test',
            password='test',
            host=''
        )
        pro_user = ProjUser.objects.create(
            host='localhost',
            hostname=host.name,
            username='test',
            remoteInbox='',
        )

        kwargs = {
            'remoteNodename': host.name,
            'requester_username': self.user1.username,
            'proj_username': pro_user.username
        }
        url = reverse('API_PostRequesting', kwargs=kwargs)
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test other
        host = Host.objects.create(
            name="other",
            username='test',
            password='test',
            host=''
        )
        pro_user = ProjUser.objects.create(
            host='localhost',
            hostname=host.name,
            username='test',
            remoteInbox='',
        )

        kwargs = {
            'remoteNodename': host.name,
            'requester_username': self.user1.username,
            'proj_username': pro_user.username
        }
        url = reverse('API_PostRequesting', kwargs=kwargs)
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unfllow_requesting(self):
        pro_user = ProjUser.objects.create(
            host='localhost',
            hostname='localhost',
            username='John',
            followers=json.dumps(['test'])
        )

        kwargs = {
            'remoteNodename': pro_user.hostname,
            'user_username': 'test',
            'proj_username': pro_user.username
        }
        url = reverse('remove_follower', kwargs=kwargs)
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pro_user.refresh_from_db()
        self.assertEqual(pro_user.followers, json.dumps([]))

    def test_remote_check_follower(self):
        pro_user = ProjUser.objects.create(
            host='localhost',
            hostname='localhost',
            username='John',
        )

        kwargs = {
            'remoteNodename': pro_user.hostname,
            'user_username': 'test',
            'proj_username': pro_user.username
        }
        url = reverse('API_CheckFollower', kwargs=kwargs)
        # Test no follower
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_follower'])

        # Test has follower
        pro_user.followers = json.dumps(['test'])
        pro_user.save(update_fields=['followers'])
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_follower'])

    def test_accept_remote_follow(self):
        pro_user = ProjUser.objects.create(
            host='localhost',
            hostname='localhost',
            username='John',
        )

        kwargs = {
            'remoteNodename': pro_user.hostname,
            'user_username': 'test',
            'proj_username': pro_user.username
        }
        url = reverse('OPEN_AcceptFollowRequest', kwargs=kwargs)
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pro_user.refresh_from_db()
        self.assertEqual(pro_user.requesters, json.dumps([]))
        self.assertEqual(pro_user.followers, json.dumps(['test']))

    def test_reject_remote_follow(self):
        pro_user = ProjUser.objects.create(
            host='localhost',
            hostname='localhost',
            username='John',
            requesters=json.dumps(['test'])
        )
        kwargs = {
            'remoteNodename': pro_user.hostname,
            'user_username': 'test',
            'proj_username': pro_user.username
        }
        url = reverse('OPEN_RejectFollowRequest', kwargs=kwargs)
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pro_user.refresh_from_db()
        self.assertEqual(pro_user.requesters, json.dumps([]))

    def test_api_all_users(self):
        url = reverse('API_ALL_USER')
        response = self.client.get(url, headers=self._headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
