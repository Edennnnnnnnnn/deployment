import json

import commonmark
import requests
import base64

import pytz
from datetime import datetime
from django.utils import timezone
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db.models import Q
import uuid


class User(AbstractUser):
    # A text field used to store the user's personal profile.
    #   blank=True indicates that this field is optional
    #   and users can not fill in the introduction when registering
    bio = models.TextField(max_length=200, blank=True)
    username = models.CharField(max_length=50, unique=True)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    email = models.EmailField()
    avatar = models.ImageField(upload_to='avatars/', default="avatars/default_avatar.png")
    github_username = models.CharField(max_length=50, blank=True)
    recent_processed_activity = models.DateTimeField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)

    def is_friend(self, other_user):
        return Friend.objects.filter(
            Q(user1=self, user2=other_user) | Q(user1=other_user, user2=self)
        ).exists()

    @property
    def avatar_url(self):
        return self.avatar.url if self.avatar else ""


class Post(models.Model):
    VISIBILITY_CHOICES = [
        ('PUBLIC', 'Public'),
        ('FRIENDS', 'Friends-Only'),
        ('PRIVATE', 'Private'),
    ]
    CONTENT_TYPE_CHOICES = [
        ('COMMONMARK', 'CommonMark'),
        ('PLAIN', 'Plain Text'),
    ]
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPE_CHOICES, default='PLAIN')
    image_data = models.TextField(blank=True, null=True)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='PUBLIC')
    date_posted = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    is_draft = models.BooleanField(default=False)
    shared_post = models.ForeignKey('self', on_delete=models.CASCADE, related_name='shared_posts', null=True, blank=True)
    ordering = ['-date_posted']

    def content_as_html(self):
        return commonmark.commonmark(self.content)

    def add_image(self, image_base64):
        if self.image_data:
            images = json.loads(self.image_data)
        else:
            images = []
        images.append(image_base64)
        self.image_data = json.dumps(images)
        self.save()

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comment', default=99999)
    commenter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commenters', default=0)
    date_commented = models.DateTimeField(auto_now_add=True)
    comment_text = models.TextField()
    class Meta:
        ordering = ['-date_commented']


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='like', default=99999)
    liker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likers', default=0)
    date_liked = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-date_liked']


class Following(models.Model):
    user = models.ForeignKey(User, related_name='following', on_delete=models.CASCADE)
    following = models.ForeignKey(User, related_name='reverse_following', on_delete=models.CASCADE)
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),   
    ]
    status = models.CharField(max_length=8, choices=STATUS_CHOICES, default='PENDING')
    date_followed = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'following',)
        ordering = ['-date_followed']


class Follower(models.Model):
    user = models.ForeignKey(User, related_name='followers', on_delete=models.CASCADE)
    follower = models.ForeignKey(User, related_name='reverse_followers', on_delete=models.CASCADE)
    date_followed = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'follower',)
        ordering = ['-date_followed']


class Friend(models.Model):
    user1 = models.ForeignKey(User, related_name='friends_set1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='friends_set2', on_delete=models.CASCADE)
    date_became_friends = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['user1', 'user2'], name='unique_friendship')]
        ordering = ['-date_became_friends']
    def clean(self):
        if self.user1 == self.user2:
            raise ValidationError("Users cannot be friends with themselves.")
    @classmethod
    def create_friendship(cls, user1, user2):
        if user1 != user2 and not cls.objects.filter(user1=user1, user2=user2).exists():
            Friend.objects.create(user1=user1, user2=user2)
            Friend.objects.create(user1=user2, user2=user1)
            Following.objects.filter(user=user1, following=user2).delete()
            Following.objects.filter(user=user2, following=user1).delete()
            Follower.objects.filter(user=user1, follower=user2).delete()
            Follower.objects.filter(user=user2, follower=user1).delete()
        else:
            raise ValidationError("Cannot create a friendship")
    @classmethod
    def delete_friendship_for_user1(cls, user1, user2):
        # if user1 != user2 and cls.objects.filter(user1=user1, user2=user2).exists():
        #     Friend.objects.filter(user1=user1, user2=user2).delete()
        #     Friend.objects.filter(user1=user2, user2=user1).delete()
        #     Following.objects.create(user=user2, following=user1)
        #     Follower.objects.create(user=user1, follower=user2)
        # else:
        #     raise ValidationError("Cannot delete a friendship")

        
        if user1 != user2 and cls.objects.filter(user1=user1, user2=user2).exists():
            cls.objects.filter(user1=user1, user2=user2).delete()
            cls.objects.filter(user1=user2, user2=user1).delete()

            # Create following relationship
            following_relation, created = Following.objects.get_or_create(
                user=user2, 
                following=user1,
                defaults={'status': 'ACCEPTED'}
            )
            if not created:
                following_relation.status = 'ACCEPTED'
                following_relation.save()

            # Create follower relationship
            follower_relation, created = Follower.objects.get_or_create(
                user=user1,
                follower=user2,
            )
        else:
            raise ValidationError("Cannot delete a friendship")


class MessageSuper(models.Model):
    MESSAGE_TYPES = [
        ('FR', 'Follow Request'),
        ('LK', 'Like'),
        ('CM', 'Comment'),
        ('NP', 'New Post Reminder'),
        ('SU', 'New Sign Up')
    ]
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    owner = models.ForeignKey(User, related_name='messages', on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(max_length=2, choices=MESSAGE_TYPES)
    content = models.CharField(max_length=500)
    origin = models.CharField(max_length=50, db_column='origin')
    class Meta:
        ordering = ['-date']
    @classmethod
    def get_messages_of_type_for_user(cls, user, message_type):
        return cls.objects.filter(owner=user, message_type=message_type)

class SignUpSettings(models.Model):
    is_signup_enabled = models.BooleanField(default=True)

class GithubActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=100)
    created_at = models.DateTimeField()

def process_github_activity(user):
    github_activity = fetch_github_activity(user)
    for activity in github_activity:
        activity_type = activity.get('type')
        created_at = datetime.strptime(activity.get('created_at'), "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=pytz.utc)
        if user.recent_processed_activity is None or created_at > user.recent_processed_activity:
            GithubActivity.objects.create(user=user, activity_type=activity_type, created_at=created_at)
            Post.objects.create(
                author=user,
                title=f"GitHub Activity",
                content=f"{activity_type} activity on GitHub at {created_at}",
                visibility='PUBLIC'
            )
    user.recent_processed_activity = timezone.now()
    user.save()

def fetch_github_activity(user):
    if user.github_username:
        github_url = f"https://api.github.com/users/{user.github_username}/events/public"
        response = requests.get(github_url)
        if response.status_code == 200:
            return response.json()
    return []


class ServerNode(models.Model):
    name = models.CharField(max_length=64, unique=True, default="Remote")
    host = models.URLField(unique=True, default="Remote")
    userAPI = models.URLField(unique=True, default="Remote")
    messageAPI = models.URLField(unique=True, default="Remote")
    def __str__(self):
        return self.name


class Host(models.Model):
    allowed = models.BooleanField(default=True)
    host = models.URLField(max_length=250, blank=True)
    name = models.CharField(max_length=200)
    username = models.CharField(max_length=50)
    password = models.CharField(max_length=50)
    def __str__(self):
        return self.name

class ProjUser(models.Model):
    host = models.URLField(max_length=250, blank=True)
    hostname = models.CharField(max_length=200)
    username = models.CharField(max_length=200)
    profile = models.URLField(max_length=250, blank=True)
    remotePosts = models.URLField(max_length=250, blank=True)
    remoteInbox = models.URLField(max_length=250, blank=True)
    otherURL = models.URLField(max_length=250, blank=True)
    requesters = models.TextField(default='[]', blank=True)
    followers = models.TextField(default='[]', blank=True)

    @property
    def requesters_list(self):
        return json.loads(self.requesters)

    @property
    def followers_list(self):
        return json.loads(self.followers)

    def has_requester(self, username):
        return username in self.requesters_list

    def add_requester(self, username):
        requesters = self.requesters_list
        if username not in requesters:
            requesters.append(username)
            self.requesters = json.dumps(requesters)
            self.save()

    def remove_requester(self, username):
        requesters = self.requesters_list
        if username in requesters:
            requesters.remove(username)
            self.requesters = json.dumps(requesters)
            self.save()

    def has_follower(self, username):
        return username in self.followers_list

    def add_follower(self, username):
        followers = self.followers_list
        if username not in followers:
            followers.append(username)
            self.followers = json.dumps(followers)
            self.save()

    def remove_follower(self, username):
        followers = self.followers_list
        if username in followers:
            followers.remove(username)
            self.followers = json.dumps(followers)
            self.save()

