use app_core::AppService;
use criterion::{Criterion, criterion_group, criterion_main};
use domain_core::command::DomainCommand;
use foundation_core::{ComponentId, Point2i, ProjectId};

fn bench_command_pipeline(criterion: &mut Criterion) {
    criterion.bench_function("command_pipeline_place_move", |bencher| {
        bencher.iter(|| {
            let mut service = AppService::new();
            let project_id: ProjectId = service.create_project("bench");

            for index in 0..200 {
                let component_id = ComponentId::new();
                let _placed = service
                    .execute(
                        project_id,
                        DomainCommand::PlaceComponent {
                            component_id,
                            name: format!("C{index}"),
                            position: Point2i::new(index * 5, index * 7),
                        },
                    )
                    .expect("place component");
                let _moved = service
                    .execute(
                        project_id,
                        DomainCommand::MoveComponent {
                            component_id,
                            to: Point2i::new(index * 8, index * 9),
                        },
                    )
                    .expect("move component");
            }
        });
    });
}

criterion_group!(benches, bench_command_pipeline);
criterion_main!(benches);
