<?php
namespace App;

require(__DIR__ . '/../vendor/autoload.php');

use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\GraphQL;
use GraphQL\Type\Schema;

class Dao
{
    private $data;

    function __construct() {
        $this->data = json_decode(file_get_contents(__DIR__ . '/data.json'), true);
    }

    function users() {
        return $this->data['users'];
    }

    function posts() {
        return $this->data['posts'];
    }

    function getUserById($id) {
        foreach ($this->data['users'] as $user) {
            if ($user['id'] == $id) {
                return $user;
            }
        }
    }

    function getPostById($id) {
        foreach ($this->data['posts'] as $post) {
            if ($post['id'] == $id) {
                return $post;
            }
        }
    }

    function getPostsByAuthorId($authorId) {
        foreach ($this->data['posts'] as $post) {
            if ($post['authorId'] == $authorId) {
                yield $post;
            }
        }
    }
}

class AppType
{
    private static $user;
    private static $post;

    static function user()
    {
        global $dao;

        if (!isset(self::$user)) {
            self::$user = new ObjectType([
                'name' => 'User',
                'fields' => function () {
                    return [
                        'id' => [
                            'type' => Type::id()
                        ],
                        'name' => [
                            'type' => Type::string()
                        ],
                        'email' => [
                            'type' => Type::string()
                        ],
                        'posts' => [
                            'type' => Type::listOf(AppType::post()),
                            'resolve' => function ($user, $args, $ctx) {
                                return iterator_to_array($ctx['dao']->getPostsByAuthorId($user['id']));
                            }
                        ]
                    ];
                }
            ]);
        }
        return self::$user;
    }

    static function post()
    {
        if (!isset(self::$post)) {
            self::$post = new ObjectType([
                'name' => 'Post',
                'fields' => function () {
                    return [
                        'id' => [
                            'type' => Type::id()
                        ],
                        'title' => [
                            'type' => Type::string()
                        ],
                        'body' => [
                            'type' => Type::string()
                        ],
                        'authorId' => [
                            'type' => Type::id()
                        ],
                        'author' => [
                            'type' => AppType::user(),
                            'resolve' => function ($post, $args, $ctx) {
                                return $ctx['dao']->getUserById($post['authorId']);
                            }
                        ]
                    ];
                }
            ]);
        }

        return self::$post;
    }
}

$queryType = new ObjectType([
    'name' => 'Query',
    'fields' => [
        'user' => [
            'type' => Type::listOf(AppType::user()),
            'args' => [
                'id' => Type::nonNull(Type::id()),
            ],
            'resolve' => function ($root, $args, $ctx) {
                return $ctx['dao']->getUserById($args['id']);
            }
        ],
        'users' => [
            'type' => Type::listOf(AppType::user()),
            'resolve' => function ($root, $args, $ctx) {
                return $ctx['dao']->users();
            }
        ],
        'post' => [
            'type' => Type::listOf(AppType::post()),
            'args' => [
                'id' => Type::nonNull(Type::id()),
            ],
            'resolve' => function ($root, $args, $ctx) {
                return $ctx['dao']->getPostById($args['id']);
            }
        ],
        'posts' => [
            'type' => Type::listOf(AppType::post()),
            'resolve' => function ($root, $args, $ctx) {
                return $ctx['dao']->posts();
            }
        ],
    ],
]);

$schema = new Schema([
    'query' => $queryType
]);

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
$query = $input['query'];
$variableValues = isset($input['variables']) ? $input['variables'] : null;

try {
    $dao = new Dao();
    $result = GraphQL::executeQuery($schema, $query, null, ['dao' => $dao], $variableValues);
    $output = $result->toArray();
} catch (\Exception $e) {
    $output = [
        'errors' => [
            [
                'message' => $e->getMessage()
            ]
        ]
    ];
}
header('Content-Type: application/json');
echo json_encode($output);