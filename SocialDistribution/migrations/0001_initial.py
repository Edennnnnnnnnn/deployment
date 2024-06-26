# Generated by Django 5.0.3 on 2024-04-08 21:19

import django.contrib.auth.models
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="Host",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("allowed", models.BooleanField(default=True)),
                ("host", models.URLField(blank=True, max_length=250)),
                ("name", models.CharField(max_length=200)),
                ("username", models.CharField(max_length=50)),
                ("password", models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name="ProjUser",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("host", models.URLField(blank=True, max_length=250)),
                ("hostname", models.CharField(max_length=200)),
                ("username", models.CharField(max_length=200)),
                ("profile", models.URLField(blank=True, max_length=250)),
                ("remotePosts", models.URLField(blank=True, max_length=250)),
                ("remoteInbox", models.URLField(blank=True, max_length=250)),
                ("otherURL", models.URLField(blank=True, max_length=250)),
                ("requesters", models.TextField(blank=True, default="[]")),
                ("followers", models.TextField(blank=True, default="[]")),
            ],
        ),
        migrations.CreateModel(
            name="ServerNode",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(default="Remote", max_length=64, unique=True),
                ),
                ("host", models.URLField(default="Remote", unique=True)),
                ("userAPI", models.URLField(default="Remote", unique=True)),
                ("messageAPI", models.URLField(default="Remote", unique=True)),
            ],
        ),
        migrations.CreateModel(
            name="SignUpSettings",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("is_signup_enabled", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="ProjPost",
            fields=[
                (
                    "remote_post_id",
                    models.CharField(
                        help_text="remote_post_id",
                        max_length=255,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("content", models.TextField()),
                (
                    "content_type",
                    models.CharField(
                        choices=[("COMMONMARK", "CommonMark"), ("PLAIN", "Plain Text")],
                        default="PLAIN",
                        max_length=10,
                    ),
                ),
                (
                    "visibility",
                    models.CharField(
                        choices=[
                            ("PUBLIC", "Public"),
                            ("FRIENDS", "Friends-Only"),
                            ("PRIVATE", "Private"),
                        ],
                        default="PUBLIC",
                        max_length=10,
                    ),
                ),
                ("image_data", models.TextField(blank=True, null=True)),
                (
                    "date_posted",
                    models.DateTimeField(default=django.utils.timezone.now),
                ),
                (
                    "proj_author",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="proj_posts",
                        to="SocialDistribution.projuser",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="User",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "last_login",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="last login"
                    ),
                ),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text="Designates that this user has all permissions without explicitly assigning them.",
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "first_name",
                    models.CharField(
                        blank=True, max_length=150, verbose_name="first name"
                    ),
                ),
                (
                    "last_name",
                    models.CharField(
                        blank=True, max_length=150, verbose_name="last name"
                    ),
                ),
                (
                    "is_staff",
                    models.BooleanField(
                        default=False,
                        help_text="Designates whether the user can log into this admin site.",
                        verbose_name="staff status",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.",
                        verbose_name="active",
                    ),
                ),
                (
                    "date_joined",
                    models.DateTimeField(
                        default=django.utils.timezone.now, verbose_name="date joined"
                    ),
                ),
                ("bio", models.TextField(blank=True, max_length=200)),
                ("username", models.CharField(max_length=50, unique=True)),
                ("uuid", models.UUIDField(default=uuid.uuid4, editable=False)),
                ("email", models.EmailField(max_length=254)),
                (
                    "avatar",
                    models.ImageField(
                        default="avatars/default_avatar.png", upload_to="avatars/"
                    ),
                ),
                ("github_username", models.CharField(blank=True, max_length=50)),
                (
                    "recent_processed_activity",
                    models.DateTimeField(blank=True, null=True),
                ),
                ("is_approved", models.BooleanField(default=False)),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "verbose_name": "user",
                "verbose_name_plural": "users",
                "abstract": False,
            },
            managers=[
                ("objects", django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="RemoteComment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date_commented", models.DateTimeField(auto_now_add=True)),
                ("comment_text", models.TextField()),
                (
                    "proj_post",
                    models.ForeignKey(
                        default=99999,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="remote_comments",
                        to="SocialDistribution.projpost",
                    ),
                ),
                (
                    "commenter",
                    models.ForeignKey(
                        default=0,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="remote_commenters",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_commented"],
            },
        ),
        migrations.CreateModel(
            name="Post",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("content", models.TextField(blank=True)),
                (
                    "content_type",
                    models.CharField(
                        choices=[("COMMONMARK", "CommonMark"), ("PLAIN", "Plain Text")],
                        default="PLAIN",
                        max_length=10,
                    ),
                ),
                ("image_data", models.TextField(blank=True, null=True)),
                (
                    "visibility",
                    models.CharField(
                        choices=[
                            ("PUBLIC", "Public"),
                            ("FRIENDS", "Friends-Only"),
                            ("PRIVATE", "Private"),
                        ],
                        default="PUBLIC",
                        max_length=10,
                    ),
                ),
                ("date_posted", models.DateTimeField(auto_now_add=True)),
                ("last_modified", models.DateTimeField(auto_now=True)),
                ("is_draft", models.BooleanField(default=False)),
                (
                    "shared_post",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="shared_posts",
                        to="SocialDistribution.post",
                    ),
                ),
                (
                    "author",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="posts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MessageSuper",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date", models.DateTimeField(auto_now_add=True)),
                (
                    "message_type",
                    models.CharField(
                        choices=[
                            ("FR", "Follow Request"),
                            ("LK", "Like"),
                            ("CM", "Comment"),
                            ("NP", "New Post Reminder"),
                            ("SU", "New Sign Up"),
                        ],
                        max_length=2,
                    ),
                ),
                ("content", models.CharField(max_length=500)),
                ("origin", models.CharField(db_column="origin", max_length=50)),
                (
                    "post",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="messages",
                        to="SocialDistribution.post",
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date"],
            },
        ),
        migrations.CreateModel(
            name="Like",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date_liked", models.DateTimeField(auto_now_add=True)),
                (
                    "post",
                    models.ForeignKey(
                        default=99999,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="like",
                        to="SocialDistribution.post",
                    ),
                ),
                (
                    "liker",
                    models.ForeignKey(
                        default=0,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="likers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_liked"],
            },
        ),
        migrations.CreateModel(
            name="GithubActivity",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("activity_type", models.CharField(max_length=100)),
                ("created_at", models.DateTimeField()),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Friend",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date_became_friends", models.DateTimeField(auto_now_add=True)),
                (
                    "user1",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="friends_set1",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user2",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="friends_set2",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_became_friends"],
            },
        ),
        migrations.CreateModel(
            name="Following",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending Approval"),
                            ("ACCEPTED", "Accepted"),
                            ("REJECTED", "Rejected"),
                        ],
                        default="PENDING",
                        max_length=8,
                    ),
                ),
                ("date_followed", models.DateTimeField(auto_now_add=True)),
                (
                    "following",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reverse_following",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="following",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_followed"],
            },
        ),
        migrations.CreateModel(
            name="Follower",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date_followed", models.DateTimeField(auto_now_add=True)),
                (
                    "follower",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reverse_followers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="followers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_followed"],
            },
        ),
        migrations.CreateModel(
            name="Comment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date_commented", models.DateTimeField(auto_now_add=True)),
                ("comment_text", models.TextField()),
                (
                    "post",
                    models.ForeignKey(
                        default=99999,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comment",
                        to="SocialDistribution.post",
                    ),
                ),
                (
                    "commenter",
                    models.ForeignKey(
                        default=0,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="commenters",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_commented"],
            },
        ),
        migrations.CreateModel(
            name="RemoteLike",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date_liked", models.DateTimeField(auto_now_add=True)),
                (
                    "proj_post",
                    models.ForeignKey(
                        default=99999,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="remote_likes",
                        to="SocialDistribution.projpost",
                    ),
                ),
                (
                    "liker",
                    models.ForeignKey(
                        default=0,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="remote_likers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_liked"],
                "unique_together": {("proj_post", "liker")},
            },
        ),
        migrations.AddConstraint(
            model_name="friend",
            constraint=models.UniqueConstraint(
                fields=("user1", "user2"), name="unique_friendship"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="following",
            unique_together={("user", "following")},
        ),
        migrations.AlterUniqueTogether(
            name="follower",
            unique_together={("user", "follower")},
        ),
    ]
