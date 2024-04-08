from django.contrib import admin
from django.utils.html import format_html

from .models import *


class UserAdmin(admin.ModelAdmin):
    list_display = (
        'username',
        'email',
        'date_joined',
        'uuid',
        'bio',
        'github_username',
        'recent_processed_activity',
        'is_approved',
        'avatar_url',
    )
    search_fields = (
        'uuid',
        'username',
        'email',
        'github_username',
    )
    list_filter = ('is_approved',)
    ordering = ('-date_joined',)


class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'date_posted', 'last_modified')
    search_fields = ('title', 'content')
    list_filter = ('date_posted', 'author')


class CommentAdmin(admin.ModelAdmin):
    list_display = ('commenter', 'date_commented', 'comment_text')
    list_filter = ('date_commented', 'commenter')


class LikeAdmin(admin.ModelAdmin):
    list_display = ('post', 'liker', 'date_liked')
    list_filter = ('date_liked', 'liker')


class FollowingAdmin(admin.ModelAdmin):
    list_display = ('user', 'following', 'date_followed')
    list_filter = ('date_followed',)
    search_fields = ('user__username', 'following__username',)


class FollowerAdmin(admin.ModelAdmin):
    list_display = ('user', 'follower', 'date_followed')
    list_filter = ('date_followed',)
    search_fields = ('user__username', 'follower__username',)


class FriendAdmin(admin.ModelAdmin):
    list_display = ('user1', 'user2', 'date_became_friends')
    list_filter = ('date_became_friends',)
    search_fields = ('user1__username', 'user2__username',)
    actions = ['remove_following_follower_relationships']
    def remove_following_follower_relationships(self, request, queryset):
        for friendship in queryset:
            Following.objects.filter(user=friendship.user1, following=friendship.user2).delete()
            Following.objects.filter(user=friendship.user2, following=friendship.user1).delete()
            Follower.objects.filter(user=friendship.user1, follower=friendship.user2).delete()
            Follower.objects.filter(user=friendship.user2, follower=friendship.user1).delete()
    remove_following_follower_relationships.short_description = "Following & follower removed for a new friendship"


class MessageAdmin(admin.ModelAdmin):
    list_display = ('owner', 'date', 'message_type', 'content', 'origin')
    list_filter = ('message_type', 'date')
    search_fields = ('content', 'owner__username', 'origin')
    ordering = ('-date',)

    actions = ['filter_messages_by_type']


class SignUpAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_signup_enabled')
    list_editable = ('is_signup_enabled',)


class ActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'created_at')
    list_filter = ('user', 'activity_type')
    search_fields = ('user__username', 'activity_type')


class ServerNodeAdmin(admin.ModelAdmin):
    list_display = ('name', 'host', 'userAPI', 'messageAPI', 'host_link')
    def host_link(self, obj):
        return format_html("<a href='{url}'>{url}</a>", url=obj.host)
    host_link.short_description = "Host URL"
    host_link.admin_order_field = 'host'
    readonly_fields = ('host_link',)


class HostAdmin(admin.ModelAdmin):
    list_display = ('allowed', 'host', 'name', 'username', 'password')
    list_filter = ('allowed',)


class ProjUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'hostname', 'host', 'profile')
    search_fields = ('username', 'hostname')
    readonly_fields = ('requesters', 'followers')

    def get_form(self, request, obj=None, **kwargs):
        form = super(ProjUserAdmin, self).get_form(request, obj, **kwargs)
        if 'requesters' in form.base_fields:
            form.base_fields['requesters'].help_text = "Enter a valid JSON array of usernames."
        if 'followers' in form.base_fields:
            form.base_fields['followers'].help_text = "Enter a valid JSON array of usernames."
        return form

class ProjPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'proj_author', 'date_posted')
    search_fields = ('title',)

class RemoteLikeAdmin(admin.ModelAdmin):
    list_display = ('proj_post', 'liker', 'date_liked')
    list_filter = ('date_liked',)
    search_fields = ('proj_post__title', 'liker__username')

class RemoteCommentAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'proj_post', 'commenter', 'date_commented', 'comment_text_short')
    list_filter = ('date_commented',)
    search_fields = ('uuid', 'proj_post__title', 'commenter__username', 'comment_text')

    def comment_text_short(self, obj):
        """A method to shorten the comment text in the list display."""
        return obj.comment_text[:50] + '...' if len(obj.comment_text) > 50 else obj.comment_text
    comment_text_short.short_description = 'Comment Text'


admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Comment, CommentAdmin)
admin.site.register(Like, LikeAdmin)
admin.site.register(Following, FollowingAdmin)
admin.site.register(Follower, FollowerAdmin)
admin.site.register(Friend, FriendAdmin)
admin.site.register(MessageSuper, MessageAdmin)
admin.site.register(SignUpSettings, SignUpAdmin)
admin.site.register(GithubActivity, ActivityAdmin)
admin.site.register(ServerNode, ServerNodeAdmin)
admin.site.register(Host, HostAdmin)
admin.site.register(ProjUser, ProjUserAdmin)
admin.site.register(ProjPost, ProjPostAdmin)
admin.site.register(RemoteLike, RemoteLikeAdmin)
admin.site.register(RemoteComment, RemoteCommentAdmin)

