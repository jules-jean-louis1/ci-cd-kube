Feature: Tasks management
  As an authenticated user
  I want to create, list, update and delete tasks
  So that I can manage my simple task list

  Background:
    Given the test database is clean

  Scenario: Full tasks lifecycle
    When I register and login as a user
    And I create a task with title "Buy milk" and description "2L"
    Then I should see 1 tasks
    And I get the task by id
    When I update the task title to "Buy almond milk"
    Then the task title should be "Buy almond milk"
    When I delete the task
    Then I should see 0 tasks
