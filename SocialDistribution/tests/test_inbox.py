#!/usr/bin/env python
# -*- coding:utf-8 -*-

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from SocialDistribution.models import User, MessageSuper


class InBoxAPITests(APITestCase):
    def setUp(self):
        # Create two test users
        self.user1 = User.objects.create_user(username='user1', password='password1')
        self.user2 = User.objects.create_user(username='user2', password='password2')
        self.client.login(username='user1', password='password1')

    def test_create_inbox(self):
        data = {
            'owner_username': self.user1.username,
            'content': 'test content',
            'origin': 'test',
            'message_type': 'LK',
        }
        url = reverse('API_POSTUserMsg')
        resp = self.client.post(url, data=data)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        queryset = MessageSuper.objects.filter(owner=self.user1)
        self.assertTrue(queryset.exists())

    def test_get_inbox(self):
        message_box = MessageSuper.objects.create(
            owner=self.user1,
            message_type='LK',
            content='test message'
        )
        url = reverse('API_GETUserMsgs', kwargs={'type': message_box.message_type})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data[0]['id'], message_box.id)

    def test_delete_by_type(self):
        message_box1 = MessageSuper.objects.create(
            owner=self.user1,
            message_type='NP',
            content='test message'
        )
        MessageSuper.objects.create(
            owner=self.user1,
            message_type='LK',
            content='test message'
        )

        url = reverse('API_DELETEMsgType', kwargs={'type': message_box1.message_type})
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

        queryset = MessageSuper.objects.filter(message_type='NP')
        self.assertFalse(queryset.exists())

        queryset = MessageSuper.objects.filter(message_type='LK')
        self.assertTrue(queryset.exists())

    def test_delete_by_id(self):
        message_box1 = MessageSuper.objects.create(
            owner=self.user1,
            message_type='NP',
            content='test message'
        )
        url = reverse('API_DELETEMsgID', kwargs={'ID': message_box1.id})
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        queryset = MessageSuper.objects.filter(message_type='NP')
        self.assertFalse(queryset.exists())
