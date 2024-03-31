#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os.path
import uuid

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from SocialDistribution.models import User, Post, Following, Follower, Friend


class UserAPITests(APITestCase):
    def setUp(self):
        # Create two test users
        self.user1 = User.objects.create_user(username='user1', password='password1', is_approved=True)
        self.user2 = User.objects.create_user(username='user2', password='password2', is_approved=True)
        self.client.login(username='user1', password='password1')

    def test_upload_avatar(self):
        url = reverse('API_UploadAvatar', kwargs={'username': self.user1.username})
        img = open(os.path.join(settings.MEDIA_ROOT, 'static/avatars/default_avatar_zvN2tG5.png'), 'rb').read()
        uploaded_file = SimpleUploadedFile('default_avatar_zvN2tG5.png', img, content_type='image/png')
        data = {'avatar': uploaded_file}
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.user1.refresh_from_db()
        self.assertIn("default_avatar_zvN2tG5", self.user1.avatar.url)

    def test_update_username(self):
        url = reverse('API_UpdateUsername', kwargs={'username': self.user1.username})
        data = {'username': uuid.uuid4().hex[:8]}
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.username, data['username'])
    
    def test_update_github_username(self):
        url = reverse('API_UpdateGithubUsername', kwargs={'username': self.user1.username})
        data = {'github_username': uuid.uuid4().hex[:8]}
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.github_username, data['github_username'])

    def test_update_bio(self):
        url = reverse('API_UpdateBio', kwargs={'username': self.user1.username})
        data = {'bio': 'test'}
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.bio, data['bio'])

    def test_get_profile(self):
        url = reverse('PAGE_Profile', kwargs={'username': self.user1.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.user1.username)

    def test_get_other_profile(self):
        kwargs = {
            'selfUsername': self.user1.username,
            'targetUsername': self.user2.username
        }
        url = reverse('PAGE_OtherProfile', kwargs=kwargs)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.user2.username)

    def test_get_draft(self):
        url = reverse('API_AuthorDraft', kwargs={'username': self.user1.username, })
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.user1.username)

    def test_any_relations(self):
        url = reverse(
            'API_AnalyzeRelation',
            kwargs={'username1': self.user1.username, 'username2': self.user2.username}
        )

        Following.objects.create(user=self.user1, following=self.user2)
        Following.objects.create(user=self.user2, following=self.user1)
        Follower.objects.create(user=self.user1, follower=self.user2)
        Follower.objects.create(user=self.user2, follower=self.user1)
        Friend.objects.create(user1=self.user1, user2=self.user2)
        Friend.objects.create(user1=self.user2, user2=self.user1)
        data = {
            'user1_follows_user2': True,
            'user2_follows_user1': True,
            'user1_followed_by_user2': True,
            'user2_followed_by_user1': True,
            'already_friend': True,
            'mutual_follow': True,
        }
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, data)

    def test_get_posts(self):
        Post.objects.create(author=self.user1, title='Test Post', content='Test Content')
        url = reverse('API_profile', kwargs={'username': self.user1.username})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data['posts']), 1)

    def test_inbox_page(self):
        url = reverse('PAGE_Inbox', kwargs={'username': self.user1.username})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertContains(resp, 'Your Inbox')

    def test_search_user(self):
        url = reverse('PAGE_SearchUser')
        resp = self.client.get(f"{url}?q={self.user1.username}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertContains(resp, f'/profile/{self.user1.username}/')

    # =================================
    # ======= User Following ==========
    # =================================
    def test_create_following_user(self):
        # Test following a user
        data = {'selfUsername': self.user1.username, 'targetUsername': self.user2.username}
        url = reverse('API_POSTFollowing', kwargs=data)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user2.refresh_from_db()

        queryset = Following.objects.filter(user=self.user1, following=self.user2)
        self.assertTrue(queryset.exists())
        self.assertEqual(queryset.first().status, 'PENDING')

    def test_get_following(self):
        # Test getting list of following for a user
        url = reverse(
            'API_GETFollowing',
            kwargs={'username': self.user1.username}
        )  # Assume this is the correct URL name
        # The user1 should follow user2 to have a non-empty following list
        self.user1.following.add(Following.objects.create(user=self.user1, following=self.user2, status='ACCEPTED'))
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.user2.username, [followee['following']['username'] for followee in response.data])

    def test_unfollowing_user(self):
        # Test unfollowing a user
        data = {'selfUsername': self.user1.username, 'targetUsername': self.user2.username}
        url = reverse('API_DELETEFollowing', kwargs=data)
        self.user2.following.add(Following.objects.create(user=self.user2, following=self.user1))
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(self.user2.following.filter(pk=self.user1.pk).exists())

    # =================================
    # ======= User Follower ===========
    # =================================
    def test_create_follower_user(self):
        # Test following a user
        data = {'selfUsername': self.user1.username, 'targetUsername': self.user2.username}
        url = reverse('API_POSTFollowerOf', kwargs=data)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user2.refresh_from_db()
        # self.assertTrue(self.user2.followers.filter(pk=self.user1.pk).exists())

    def test_unfollower_user(self):
        # Test unfollowing a user
        data = {'selfUsername': self.user1.username, 'targetUsername': self.user2.username}
        url = reverse('API_DELETEFollowerOf', kwargs=data)
        # The user1 should follow user2 first to unfollow later
        self.user2.followers.add(Follower.objects.create(user=self.user2, follower=self.user1))
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(self.user2.followers.filter(pk=self.user1.pk).exists())

    def test_get_followers(self):
        # Test getting list of followers for a user
        url = reverse(
            'API_GETFollowers',
            kwargs={'username': self.user2.username}
        )  # Assume this is the correct URL name
        # The user1 should follow user2 to have a non-empty followers list
        self.user2.followers.add(Follower.objects.create(user=self.user2, follower=self.user1))
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.user1.username, [follower['follower']['username'] for follower in response.data])

    # =================================
    # ======= User Friend =============
    # =================================
    def test_post_friends(self):
        url = reverse(
            'API_POSTFriend',
            kwargs={'selfUsername': self.user1.username, 'targetUsername': self.user2.username}
        )
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        queryset = Friend.objects.filter(user1=self.user1, user2=self.user2)
        self.assertTrue(queryset.exists())

    def test_get_friends(self):
        url = reverse(
            'API_GETFriends',
            kwargs={'username': self.user1.username}
        )
        Friend.objects.create(user1=self.user1, user2=self.user2)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data[0]['user1']['username'], self.user1.username)

    def test_delete_friends(self):
        url = reverse(
            'API_DELETEFriend',
            kwargs={'selfUsername': self.user1.username, 'targetUsername': self.user2.username}
        )
        Friend.objects.create(user1=self.user1, user2=self.user2)
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        queryset = Friend.objects.filter(user1=self.user1, user2=self.user2)
        self.assertFalse(queryset.exists())

    def test_friend_posts(self):
        url = reverse('PAGE_FriendPosts', kwargs={'username': self.user1.username})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
