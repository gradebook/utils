# 0.3.1

 - Fix test/lint issue

# 0.3.0

 - Expose validation internals. This will allow course serializer to be the source of truth for most course validation
 - Fix node 16 support
 - Reduce size of serialized payload by removing null characters
 - Add initial support for separating metadata for year-agnostic searches
 - Fix category validation logic
 - Add support for droppedGrades being null (opposed to 0)
 - Allow course name to have a space ` ` or dash `-` to separate name and number

# 0.2.6

 - :bug: fix node.js/browser interop failure
