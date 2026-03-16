import { expect, test, type Locator, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:8010/api';

async function dragBetween(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('drag target not visible');
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 12, sourceBox.y + sourceBox.height / 2 + 12, {
    steps: 4,
  });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 16,
  });
  await page.mouse.up();
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

test('project ops journey works end to end', async ({ page, request }) => {
  const stamp = Date.now();
  const projectName = `ops-${stamp}`;
  const taskTitle = `task-${stamp}`;
  const columnName = `queue-${stamp}`;
  const renamedColumn = `launch-${stamp}`;
  const renamedDoneColumn = `complete-${stamp}`;
  const labelName = `label-${stamp}`;
  const commentText = `comment-${stamp}`;
  const hiddenTaskTitle = `hidden-${stamp}`;
  const savedViewName = `focus-${stamp}`;
  const renamedViewName = `focus-alt-${stamp}`;

  await page.goto('/projects');
  await page.locator('main').getByRole('button', { name: 'New Project', exact: true }).click();
  await page.getByPlaceholder('Project name...').fill(projectName);
  await page.getByPlaceholder('Optional description...').fill('playwright managed project');
  await page.getByRole('button', { name: 'Create' }).click();

  const projectCardTitle = page.locator('main').getByRole('heading', { name: projectName, exact: true }).first();
  await expect(projectCardTitle).toBeVisible();
  await projectCardTitle.click();
  await expect(page.getByRole('heading', { name: projectName, exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'add column' }).click();
  await page.getByPlaceholder('column name').fill(columnName);
  await page.getByRole('button', { name: 'create', exact: true }).last().click();
  await expect(page.locator(`[data-column-name="${columnName}"]`)).toBeVisible();

  await page.getByRole('button', { name: `Rename ${columnName}` }).click();
  await page.locator(`[data-column-name="${columnName}"] input`).fill(renamedColumn);
  await page.getByRole('button', { name: `Save ${columnName}` }).click();
  await expect(page.locator(`[data-column-name="${renamedColumn}"]`)).toBeVisible();

  await dragBetween(
    page,
    page.getByRole('button', { name: `Reorder ${renamedColumn}` }),
    page.locator('[data-column-name="Backlog"]')
  );

  const reorderedColumns = page.locator('[data-column-name]');
  await expect(reorderedColumns.first()).toHaveAttribute('data-column-name', renamedColumn);

  await page.getByRole('button', { name: 'Rename Done' }).click();
  await page.locator('[data-column-kind="done"] input').fill(renamedDoneColumn);
  await page.getByRole('button', { name: 'Save Done' }).click();
  await expect(page.locator(`[data-column-kind="done"][data-column-name="${renamedDoneColumn}"]`)).toBeVisible();

  const projectId = page.url().split('/').pop();
  expect(projectId).toBeTruthy();

  const projectDetailResponse = await request.get(`${apiBaseUrl}/projects/${projectId}`);
  expect(projectDetailResponse.ok()).toBeTruthy();
  const projectDetail = await projectDetailResponse.json();
  const backlogColumn = projectDetail.columns.find((column: { name: string }) => column.name === 'Backlog');
  expect(backlogColumn).toBeTruthy();

  const taskResponse = await request.post(`${apiBaseUrl}/tasks`, {
    data: {
      project_id: projectId,
      column_id: backlogColumn.id,
      title: taskTitle,
      description: 'playwright seeded task',
      priority: 'high',
    },
  });
  expect(taskResponse.ok()).toBeTruthy();
  await taskResponse.json();
  const hiddenTaskResponse = await request.post(`${apiBaseUrl}/tasks`, {
    data: {
      project_id: projectId,
      column_id: backlogColumn.id,
      title: hiddenTaskTitle,
      description: 'unlabeled task',
      priority: 'medium',
    },
  });
  expect(hiddenTaskResponse.ok()).toBeTruthy();

  await page.reload();
  await expect(page.getByRole('heading', { name: projectName, exact: true })).toBeVisible();

  const taskCard = page.locator(`[data-task-title="${taskTitle}"]`).first();
  await expect(taskCard).toBeVisible();

  await page.getByTestId('project-label-create-name').fill(labelName);
  await page.getByRole('button', { name: 'Create Label' }).click();
  await expect(page.getByText(labelName).first()).toBeVisible();

  const doneColumn = projectDetail.columns.find((column: { kind: string }) => column.kind === 'done');
  expect(doneColumn).toBeTruthy();
  await taskCard.hover();
  await dragBetween(
    page,
    taskCard.getByRole('button', { name: 'Drag task' }),
    page.locator('[data-column-kind="done"] [data-testid^="kanban-column-dropzone-"]').first()
  );
  await expect(page.locator('[data-column-kind="done"]').getByText(taskTitle)).toBeVisible();

  await page.locator('[data-column-kind="done"]').getByText(taskTitle).click();
  await expect(page.getByRole('heading', { name: 'Task Details' })).toBeVisible();
  const taskDetailPanel = page.getByTestId('task-detail-panel');

  await taskDetailPanel.getByRole('button', { name: 'Add' }).click();
  await taskDetailPanel.getByRole('button', { name: labelName }).click();
  await expect(taskDetailPanel.getByText(labelName)).toBeVisible();

  await taskDetailPanel.getByPlaceholder('Write a comment...').fill(commentText);
  await taskDetailPanel.getByRole('button', { name: 'Send comment' }).click();
  await expect(taskDetailPanel.getByText(commentText)).toBeVisible();

  await page.getByRole('button', { name: 'Close panel' }).click();
  const boardLabelFilter = page.getByTestId('board-label-filter');
  await boardLabelFilter.getByRole('button', { name: new RegExp(labelName, 'i') }).click();
  await expect(page.locator('[data-column-kind="done"]').getByText(taskTitle)).toBeVisible();
  await expect(page.getByText(hiddenTaskTitle)).not.toBeVisible();

  await boardLabelFilter.getByRole('button', { name: /clear filters/i }).click();
  await boardLabelFilter.getByRole('button', { name: /priority high/i }).click();
  await expect(page.locator('[data-column-kind="done"]').getByText(taskTitle)).toBeVisible();
  await expect(page.getByText(hiddenTaskTitle)).not.toBeVisible();

  await boardLabelFilter.getByRole('button', { name: /clear filters/i }).click();
  await boardLabelFilter.getByRole('button', { name: /status done/i }).click();
  await expect(page.locator('[data-column-kind="done"]').getByText(taskTitle)).toBeVisible();
  await expect(page.getByText(hiddenTaskTitle)).not.toBeVisible();

  await boardLabelFilter.getByRole('button', { name: /clear filters/i }).click();
  await boardLabelFilter.getByRole('button', { name: new RegExp(labelName, 'i') }).click();
  await boardLabelFilter.getByRole('button', { name: /priority high/i }).click();
  await boardLabelFilter.getByRole('button', { name: /status done/i }).click();
  await page.getByPlaceholder('view name').fill(savedViewName);
  await page.getByRole('button', { name: /save current view/i }).click();
  await expect(page.getByRole('button', { name: new RegExp(`Open pinned view ${savedViewName}`, 'i') })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(`Rename view ${savedViewName}`, 'i') }).click();
  await page.getByRole('textbox', { name: new RegExp(`Rename ${savedViewName}`, 'i') }).fill(renamedViewName);
  await page.getByRole('button', { name: new RegExp(`Save ${savedViewName}`, 'i') }).click();
  await expect(page.getByRole('button', { name: new RegExp(`Open pinned view ${renamedViewName}`, 'i') })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(`Clear default ${renamedViewName}`, 'i') })).toBeVisible();

  const bulkActions = page.getByTestId('bulk-task-actions');
  await bulkActions.getByTestId('bulk-priority-select').selectOption('urgent');
  await bulkActions.getByRole('button', { name: /update slice priority/i }).click();

  await boardLabelFilter.getByRole('button', { name: /clear filters/i }).click();
  await expect(page.getByText(hiddenTaskTitle)).toBeVisible();
  await page.getByRole('button', { name: new RegExp(`Open pinned view ${renamedViewName}`, 'i') }).click();
  await boardLabelFilter.getByRole('button', { name: /priority high/i }).click();
  await boardLabelFilter.getByRole('button', { name: /priority urgent/i }).click();
  await page.getByRole('button', { name: /overwrite active/i }).click();
  await boardLabelFilter.getByRole('button', { name: /clear filters/i }).click();
  await page.reload();
  await expect(page.locator('[data-column-kind="done"]').getByText(taskTitle)).toBeVisible();
  await expect(page.getByText(hiddenTaskTitle)).not.toBeVisible();

  await page.goto('/');
  await expect(page.getByText('Recent Activity')).toBeVisible();
  const dashboardFilter = page.getByTestId('dashboard-label-filter');
  await dashboardFilter.getByRole('button', { name: new RegExp(labelName, 'i') }).click();
  await dashboardFilter.getByRole('button', { name: /priority urgent/i }).click();
  await dashboardFilter.getByRole('button', { name: /status done/i }).click();
  await expect(page.locator('main').getByText(projectName).first()).toBeVisible();
  await expect(page.getByText('Total Tasks')).toBeVisible();
});

test('archived projects can be filtered', async ({ page }) => {
  const stamp = Date.now();
  const projectName = `archive-${stamp}`;

  await page.goto('/projects');
  await page.locator('main').getByRole('button', { name: 'New Project', exact: true }).click();
  await page.getByPlaceholder('Project name...').fill(projectName);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('main').getByRole('heading', { name: projectName, exact: true }).first()).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: `Archive ${projectName}` }).click();

  await page.getByRole('button', { name: 'archived' }).click();
  const archivedProjectCard = page.locator('main').getByRole('heading', { name: projectName, exact: true }).first();
  await expect(archivedProjectCard).toBeVisible();
  await archivedProjectCard.click();
  await expect(page.getByText(/this board is read-only/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'add column' })).not.toBeVisible();
  await page.goto('/projects');
  await page.getByRole('button', { name: 'archived' }).click();
  await page.getByRole('button', { name: `Restore ${projectName}` }).click();
  await expect(archivedProjectCard).not.toBeVisible();

  await page.getByRole('button', { name: 'active' }).click();
  await expect(page.locator('main').getByRole('heading', { name: projectName, exact: true }).first()).toBeVisible();
});
